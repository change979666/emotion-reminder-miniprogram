/**
 * @file stickers 云函数：处理贴纸相关逻辑
 * 
 * 集合：stickers - 所有贴纸定义
 * 集合：user_stickers - 用户拥有的贴纸
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
       * 初始化所有贴纸到数据库
       */
      case 'initStickers': {
        const stickers = data.stickers || [];
        
        // 批量插入
        const batch = [];
        for (let sticker of stickers) {
          batch.push(
            db.collection('stickers').add({
              data: {
                ...sticker,
                createdAt: Date.now()
              }
            })
          );
        }
        
        await Promise.all(batch);
        return { ok: true, count: stickers.length };
      }

      /**
       * 获取所有贴纸列表
       */
      case 'listAll': {
        const res = await db
          .collection('stickers')
          .orderBy('category', 'asc')
          .orderBy('order', 'asc')
          .get();
        
        return { ok: true, list: res.data };
      }

      /**
       * 获取用户拥有的贴纸
       */
      case 'getUserStickers': {
        const res = await db
          .collection('user_stickers')
          .where({
            _openid: wxContext.OPENID
          })
          .orderBy('obtainedAt', 'desc')
          .get();
        
        return { ok: true, list: res.data };
      }

      /**
       * 赠送贴纸给用户
       * data: { stickerId, source, sourceId }
       */
      case 'grantSticker': {
        const { stickerId, source, sourceId } = data;
        
        // 检查是否已拥有
        const existing = await db
          .collection('user_stickers')
          .where({
            _openid: wxContext.OPENID,
            stickerId
          })
          .get();
        
        if (existing.data.length > 0) {
          return { ok: false, error: 'already_owned' };
        }
        
        // 添加到用户贴纸
        await db.collection('user_stickers').add({
          data: {
            _openid: wxContext.OPENID,
            stickerId,
            source, // 'daily', 'achievement', 'reply', 'shop'
            sourceId, // 成就ID、回复ID等
            obtainedAt: Date.now(),
            isNew: true // 标记为新获得
          }
        });
        
        return { ok: true };
      }

      /**
       * 标记贴纸为已查看
       * data: { userStickerId }
       */
      case 'markAsViewed': {
        const { userStickerId } = data;
        
        await db.collection('user_stickers').doc(userStickerId).update({
          data: {
            isNew: false
          }
        });
        
        return { ok: true };
      }

      /**
       * 获取新贴纸数量
       */
      case 'getNewCount': {
        const res = await db
          .collection('user_stickers')
          .where({
            _openid: wxContext.OPENID,
            isNew: true
          })
          .count();
        
        return { ok: true, count: res.total };
      }

      default:
        throw new Error('Unknown action: ' + action);
    }
  } catch (error) {
    console.error('Stickers function error:', error);
    return { ok: false, error: error.message };
  }
};
