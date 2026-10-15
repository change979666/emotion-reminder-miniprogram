/**
 * @file notifications 云函数：处理消息通知的所有数据逻辑
 *
 * 集合：notifications
 * 字段约定：
 * - _openid: 接收者 openid（自动注入）
 * - _id: MongoDB 自动生成的文档 ID
 * - type: 通知类型 'resonance' | 'comment' | 'reply'
 * - postId: 关联的帖子 ID
 * - commentId: 关联的评论 ID（回复通知时使用）
 * - postTitle: 帖子标题
 * - fromName: 发送者昵称
 * - fromOpenid: 发送者 openid
 * - content: 通知内容
 * - createdAt: 创建时间
 * - read: 是否已读
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
       * 创建通知
       * data: { toOpenid, type, postId, commentId?, postTitle, fromName, content? }
       */
      case 'create': {
        const { toOpenid, type, postId, commentId, postTitle, fromName, content } = data;
        if (!toOpenid || !type || !postId || !postTitle) {
          throw new Error('invalid notification data');
        }
        
        // 不给自己发通知
        if (toOpenid === wxContext.OPENID) {
          return { ok: true, skipped: true };
        }
        
        const now = Date.now();
        const res = await db.collection('notifications').add({
          data: {
            _openid: toOpenid,
            type,
            postId,
            commentId: commentId || null,
            postTitle,
            fromName: fromName || '匿名用户',
            fromOpenid: wxContext.OPENID,
            content: content || '',
            createdAt: now,
            read: false
          }
        });
        return { ok: true, _id: res._id };
      }

      /**
       * 获取当前用户的通知列表
       * data: { page?, pageSize?, unreadOnly? }
       */
      case 'list': {
        const { page = 1, pageSize = 20, unreadOnly = false } = data;
        const skip = (page - 1) * pageSize;
        
        let whereCondition = { _openid: wxContext.OPENID };
        if (unreadOnly) {
          whereCondition.read = false;
        }
        
        const res = await db
          .collection('notifications')
          .where(whereCondition)
          .orderBy('createdAt', 'desc')
          .skip(skip)
          .limit(pageSize)
          .get();
        
        return { ok: true, list: res.data || [] };
      }

      /**
       * 获取未读通知数量
       */
      case 'countUnread': {
        const res = await db
          .collection('notifications')
          .where({
            _openid: wxContext.OPENID,
            read: false
          })
          .count();
        
        return { ok: true, count: res.total || 0 };
      }

      /**
       * 标记通知为已读
       * data: { notificationId }
       */
      case 'markRead': {
        const { notificationId } = data;
        if (!notificationId) throw new Error('missing notificationId');
        
        await db.collection('notifications').doc(notificationId).update({
          data: {
            read: true
          }
        });
        
        return { ok: true };
      }

      /**
       * 标记所有通知为已读
       */
      case 'markAllRead': {
        await db
          .collection('notifications')
          .where({
            _openid: wxContext.OPENID,
            read: false
          })
          .update({
            data: {
              read: true
            }
          });
        
        return { ok: true };
      }

      /**
       * 删除通知
       * data: { notificationId }
       */
      case 'delete': {
        const { notificationId } = data;
        if (!notificationId) throw new Error('missing notificationId');
        
        await db
          .collection('notifications')
          .where({
            _openid: wxContext.OPENID,
            _id: notificationId
          })
          .remove();
        
        return { ok: true };
      }

      /**
       * 清空所有已读通知
       */
      case 'clearRead': {
        await db
          .collection('notifications')
          .where({
            _openid: wxContext.OPENID,
            read: true
          })
          .remove();
        
        return { ok: true };
      }

      default:
        throw new Error('unknown action: ' + action);
    }
  } catch (error) {
    console.error('notifications cloud function error:', error);
    return { ok: false, error: error.message || 'unknown error' };
  }
};
