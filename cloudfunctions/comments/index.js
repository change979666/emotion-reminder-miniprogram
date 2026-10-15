/**
 * @file comments 云函数：处理社区评论和回复的所有数据逻辑
 *
 * 集合：comments
 * 字段约定：
 * - _openid: 用户 openid（自动注入）
 * - _id: MongoDB 自动生成的文档 ID
 * - postId: 关联的帖子 ID
 * - parentId: 父评论 ID（回复时使用）
 * - content: 评论内容
 * - nickName: 昵称
 * - avatarUrl: 头像
 * - likeCount: 点赞数
 * - createdAt: 创建时间
 * - isAnonymous: 是否匿名
 */

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, data = {} } = event;
  const wxContext = cloud.getWXContext();

  try {
    switch (action) {
      /**
       * 创建评论或回复
       * data: { postId, parentId?, content, nickName, avatarUrl, isAnonymous }
       */
      case 'create': {
        const { postId, parentId, content, nickName, avatarUrl, isAnonymous } = data;
        if (!postId || !content) {
          throw new Error('invalid comment data');
        }
        const now = Date.now();
        const res = await db.collection('comments').add({
          data: {
            _openid: wxContext.OPENID,
            postId,
            parentId: parentId || null,
            content,
            nickName: nickName || '匿名用户',
            avatarUrl: avatarUrl || '',
            likeCount: 0,
            createdAt: now,
            isAnonymous: !!isAnonymous
          }
        });
        return { ok: true, _id: res._id };
      }

      /**
       * 获取某个帖子的所有评论（包括回复）
       * data: { postId, page?, pageSize? }
       */
      case 'listByPost': {
        const { postId, page = 1, pageSize = 20 } = data;
        if (!postId) throw new Error('missing postId');
        
        const skip = (page - 1) * pageSize;
        const res = await db
          .collection('comments')
          .where({ postId, parentId: _.eq(null) })
          .orderBy('createdAt', 'desc')
          .skip(skip)
          .limit(pageSize)
          .get();
        
        // 获取每个评论的回复
        const comments = res.data || [];
        for (let comment of comments) {
          const repliesRes = await db
            .collection('comments')
            .where({ parentId: comment._id })
            .orderBy('createdAt', 'asc')
            .get();
          comment.replies = repliesRes.data || [];
        }
        
        return { ok: true, list: comments };
      }

      /**
       * 获取评论总数
       * data: { postId }
       */
      case 'countByPost': {
        const { postId } = data;
        if (!postId) throw new Error('missing postId');
        
        const res = await db
          .collection('comments')
          .where({ postId })
          .count();
        
        return { ok: true, count: res.total || 0 };
      }

      /**
       * 点赞/取消点赞评论
       * data: { commentId, action: 'like' | 'unlike' }
       */
      case 'toggleLike': {
        const { commentId, action: likeAction } = data;
        if (!commentId) throw new Error('missing commentId');
        
        const increment = likeAction === 'like' ? 1 : -1;
        await db.collection('comments').doc(commentId).update({
          data: {
            likeCount: _.inc(increment)
          }
        });
        
        return { ok: true };
      }

      /**
       * 删除评论（仅创建者可删除）
       * data: { commentId }
       */
      case 'delete': {
        const { commentId } = data;
        if (!commentId) throw new Error('missing commentId');
        
        // 验证是否是创建者
        const commentRes = await db
          .collection('comments')
          .doc(commentId)
          .get();
        
        if (!commentRes.data || commentRes.data._openid !== wxContext.OPENID) {
          throw new Error('permission denied');
        }
        
        // 删除评论及其所有回复
        await db.collection('comments').doc(commentId).remove();
        await db.collection('comments').where({ parentId: commentId }).remove();
        
        return { ok: true };
      }

      /**
       * 获取用户的评论列表
       * data: { page?, pageSize? }
       */
      case 'listByUser': {
        const { page = 1, pageSize = 20 } = data;
        const skip = (page - 1) * pageSize;
        
        const res = await db
          .collection('comments')
          .where({ _openid: wxContext.OPENID })
          .orderBy('createdAt', 'desc')
          .skip(skip)
          .limit(pageSize)
          .get();
        
        return { ok: true, list: res.data || [] };
      }

      default:
        throw new Error('unknown action: ' + action);
    }
  } catch (error) {
    console.error('comments cloud function error:', error);
    return { ok: false, error: error.message || 'unknown error' };
  }
};
