/**
 * @file letters 云函数：处理信件 & 社区广场 & 互助区 & 用户管理的所有数据逻辑
 *
 * 集合：letters
 * 字段约定：
 * - _openid: 用户 openid（自动注入）
 * - id: 客户端生成的简易 id（便于前端引用）
 * - type: 'future' | 'display' | 'help'  信件类型
 * - title, content, targetDate, createdAt, mood
 * - shareable, remindEnabled, published, likeCount
 * - capsuleImagePath, capsuleAudioPath
 * - reminderSent, reminderSentAt
 * - status: 'pending' | 'active' | 'blocked' （内容安全状态）
 * - replyCount: 求助信收到的回复数
 *
 * 集合：help_replies
 * - letterId, _openid, content, createdAt, status
 *
 * 集合：users
 * - _openid: 用户 openid（自动注入）
 * - nickName, avatarUrl, phoneNumber, gender
 * - points, level, continuousDays, totalPoints
 * - achievements, unlockedAchievements, claimedAchievementRewards
 * - createdAt, updatedAt
 *
 * 集合：user_settings
 * - _openid: 用户 openid（自动注入）
 * - notificationSettings, privacySettings, preferences
 * - nightModeTime
 */

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

/**
 * 文本内容安全检测
 * @param {string} content
 * @returns {Promise<'ok' | 'block' | 'error'>}
 */
async function checkText(content) {
  if (!content) return 'ok';
  try {
    await cloud.openapi.security.msgSecCheck({
      content: content,
      version: 2,
      scene: 1
    });
    return 'ok';
  } catch (err) {
    // 命中风险或接口异常，都统一视为不通过，由前端给温和提示
    console.error('msgSecCheck error', err);
    // err.errCode === 87014 等情况表示内容违规
    if (err && typeof err.errCode === 'number') {
      return 'block';
    }
    return 'error';
  }
}

exports.main = async (event, context) => {
  const { action, data = {} } = event;
  const wxContext = cloud.getWXContext();

  try {
    switch (action) {
      /**
       * 创建一封写给未来的信
       * data: { letter }
       */
      case 'create': {
        const { letter } = data;
        if (!letter || !letter.content || !letter.targetDate) {
          throw new Error('invalid letter data');
        }
        const now = Date.now();
        const res = await db.collection('letters').add({
          data: {
            ...letter,
            _openid: wxContext.OPENID,
            createdAt: now,
            type: 'future',
            status: 'active',
            likeCount: 0,
            published: !!letter.published,
            replyCount: 0,
            reminderSent: false
          }
        });
        return { ok: true, _id: res._id };
      }

      /**
       * 获取当前用户的所有信件（按目标日期排序）
       * data: { type?: 'future' | 'display' | 'help' }
       */
      case 'listByUser': {
        const { type } = data;
        let whereCondition = { _openid: wxContext.OPENID };
        if (type) {
          whereCondition.type = type;
        }
        const res = await db
          .collection('letters')
          .where(whereCondition)
          .orderBy('targetDate', 'asc')
          .get();
        return { ok: true, list: res.data || [] };
      }

      /**
       * 更新信件
       * data: { id, updates }
       */
      case 'update': {
        const { id, updates } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            id
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const docId = res.data[0]._id;
        await db.collection('letters').doc(docId).update({
          data: updates
        });
        return { ok: true };
      }

      /**
       * 软删除信件（回收站）
       * data: { id }
       */
      case 'softDelete': {
        const { id } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            id
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const docId = res.data[0]._id;
        await db.collection('letters').doc(docId).update({
          data: { deletedAt: Date.now() }
        });
        return { ok: true };
      }

      /**
       * 还原信件
       * data: { id }
       */
      case 'restore': {
        const { id } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            id
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const docId = res.data[0]._id;
        await db.collection('letters').doc(docId).update({
          data: { deletedAt: null }
        });
        return { ok: true };
      }

      /**
       * 永久删除信件
       * data: { id }
       */
      case 'delete': {
        const { id } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            id
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const docId = res.data[0]._id;
        await db.collection('letters').doc(docId).remove();
        return { ok: true };
      }

      /**
       * 增加信件阅读次数
       * data: { id }
       */
      case 'incrementReadCount': {
        const { id } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            id
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const docId = res.data[0]._id;
        const currentCount = res.data[0].readCount || 0;
        await db.collection('letters').doc(docId).update({
          data: { readCount: currentCount + 1 }
        });
        return { ok: true };
      }

      /**
       * 获取统计信息
       */
      case 'getStats': {
        const lettersRes = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            type: 'future'
          })
          .get();
        const letters = lettersRes.data || [];
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;
        
        const totalLetters = letters.length;
        const upcomingLetters = letters.filter(l => l.targetDate >= todayStr).length;
        const deliveredLetters = letters.filter(l => l.targetDate < todayStr).length;
        
        // 获取收到的回信数量
        const helpsRes = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            type: 'help'
          })
          .get();
        const helpIds = (helpsRes.data || []).map(h => h.id);
        
        let receivedReplies = 0;
        if (helpIds.length > 0) {
          const repliesRes = await db
            .collection('help_replies')
            .where({
              letterId: _.in(helpIds),
              status: 'active'
            })
            .count();
          receivedReplies = repliesRes.total || 0;
        }
        
        return {
          ok: true,
          stats: {
            totalLetters,
            upcomingLetters,
            deliveredLetters,
            receivedReplies
          }
        };
      }

      /**
       * 切换发布到社区
       * data: { id, published }
       */
      case 'togglePublish': {
        const { id, published } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            id
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const doc = res.data[0];
        const docId = doc._id;

        // 如果要公开到展示区，需要先做内容安全检测
        if (published) {
          const checkRet = await checkText(`${doc.title || ''}\n${doc.content || ''}`);
          if (checkRet !== 'ok') {
            return { ok: false, error: '内容可能包含敏感信息，暂无法公开' };
          }
        }

        await db.collection('letters').doc(docId).update({
          data: {
            published: !!published,
            type: published ? 'display' : 'future',
            status: published ? 'active' : doc.status || 'active'
          }
        });
        return { ok: true };
      }

      /**
       * 社区广场列表
       * data: { order: 'latest' | 'hot' }
       */
      case 'listCommunity': {
        const { order = 'latest' } = data;
        const orderField = order === 'hot' ? 'likeCount' : 'createdAt';
        
        // 修改：包含 type='display' 或 type='future'（已发布的）
        // 兼容没有 status 字段的旧数据
        const res = await db
          .collection('letters')
          .where({
            shareable: true,
            published: true
            // 移除 status 限制，兼容旧数据
          })
          .orderBy(orderField, 'desc')
          .limit(50)
          .get();
        
        console.log('社区广场查询结果:', {
          total: res.data.length,
          items: res.data.map(item => ({
            id: item.id,
            type: item.type,
            shareable: item.shareable,
            published: item.published,
            status: item.status
          }))
        });
        
        // 筛选出 type 为 'display' 或 'future' 的信件，并且 status 不是 'blocked'
        const filteredList = (res.data || []).filter(item => 
          (item.type === 'display' || item.type === 'future') && 
          item.status !== 'blocked'
        );
        
        console.log('筛选后结果:', filteredList.length);
        
        return { ok: true, list: filteredList };
      }

      /**
       * 根据ID获取单个信件详情
       * data: { id }
       */
      case 'getById': {
        const { id } = data;
        if (!id) {
          throw new Error('id is required');
        }
        
        // 先尝试查询 status='active' 的
        let res = await db
          .collection('letters')
          .where({
            id: id,
            status: 'active'
          })
          .get();
        
        // 如果没找到，再尝试查询所有（兼容旧数据或没有status字段的情况）
        if (!res.data || res.data.length === 0) {
          console.log('No active letter found, trying without status filter');
          res = await db
            .collection('letters')
            .where({
              id: id
            })
            .get();
        }
        
        if (res.data && res.data.length > 0) {
          return { ok: true, data: res.data[0] };
        } else {
          console.log('Letter not found with id:', id);
          return { ok: false, error: 'Letter not found' };
        }
      }

      /**
       * 点赞/共鸣
       * data: { id }
       */
      case 'like': {
        const { id } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            shareable: true,
            published: true,
            id
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const docId = res.data[0]._id;
        await db.collection('letters').doc(docId).update({
          data: {
            likeCount: _.inc(1)
          }
        });
        return { ok: true };
      }

      /**
       * 创建一封树洞求助信
       * data: { letter }
       */
      case 'createHelp': {
        const { letter } = data;
        if (!letter || !letter.content) {
          return { ok: false, error: '请填写内容' };
        }
        const now = Date.now();
        const checkRet = await checkText(`${letter.title || ''}\n${letter.content || ''}`);
        const status = checkRet === 'ok' ? 'active' : 'blocked';
        if (status === 'blocked') {
          return { ok: false, error: '内容可能包含敏感信息，请调整后再试' };
        }
        
        // 构建要保存的数据，只包含允许的字段
        const helpData = {
          id: letter.id,
          title: letter.title || '当下的小烦恼',
          content: letter.content,
          createdAt: now,
          type: 'help',
          status,
          replyCount: 0,
          _openid: wxContext.OPENID
        };
        
        // 可选字段
        if (letter.images && Array.isArray(letter.images)) {
          helpData.images = letter.images;
        }
        if (letter.videoPath) {
          helpData.videoPath = letter.videoPath;
        }
        
        try {
          const res = await db.collection('letters').add({
            data: helpData
          });
          return { ok: true, _id: res._id };
        } catch (err) {
          console.error('createHelp db error:', err);
          return { ok: false, error: '保存失败，请稍后重试' };
        }
      }

      /**
       * 获取一批可被回复的树洞求助信
       * data: { limit? }
       */
      case 'listHelpForReply': {
        const { limit = 20 } = data;
        const res = await db
          .collection('letters')
          .where({
            type: 'help',
            status: 'active',
            _openid: _.neq(wxContext.OPENID)
          })
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();
        return { ok: true, list: res.data || [] };
      }

      /**
       * 给树洞求助信写一封回复
       * data: { letterId, content }
       */
      case 'createReply': {
        const { letterId, content } = data;
        if (!letterId || !content) {
          throw new Error('invalid reply data');
        }
        const checkRet = await checkText(content);
        if (checkRet !== 'ok') {
          return { ok: false, error: '回复内容可能包含敏感信息，请调整后再试' };
        }

        const now = Date.now();
        // 确认求助信存在且为 active
        const letterRes = await db
          .collection('letters')
          .where({
            id: letterId,
            type: 'help',
            status: 'active'
          })
          .get();
        if (!letterRes.data || !letterRes.data.length) {
          throw new Error('help letter not found');
        }
        const helpDocId = letterRes.data[0]._id;

        await db.collection('help_replies').add({
          data: {
            letterId,
            _openid: wxContext.OPENID,
            content,
            createdAt: now,
            status: 'active'
          }
        });

        await db.collection('letters').doc(helpDocId).update({
          data: {
            replyCount: _.inc(1)
          }
        });

        return { ok: true };
      }

      /**
       * 获取当前用户的所有树洞求助及其回复
       */
      case 'listMyHelps': {
        const helpsRes = await db
          .collection('letters')
          .where({
            _openid: wxContext.OPENID,
            type: 'help'
          })
          .orderBy('createdAt', 'desc')
          .get();
        const helps = helpsRes.data || [];
        if (!helps.length) return { ok: true, list: [] };

        const ids = helps.map((h) => h.id);
        const repliesRes = await db
          .collection('help_replies')
          .where({
            letterId: _.in(ids),
            status: 'active'
          })
          .orderBy('createdAt', 'asc')
          .get();
        const replies = repliesRes.data || [];

        const replyMap = {};
        replies.forEach((r) => {
          if (!replyMap[r.letterId]) replyMap[r.letterId] = [];
          replyMap[r.letterId].push(r);
        });

        const merged = helps.map((h) => ({
          ...h,
          replies: replyMap[h.id] || []
        }));

        return { ok: true, list: merged };
      }

      /**
       * 获取某一封树洞求助信的所有回复
       * data: { letterId }
       */
      case 'listRepliesForLetter': {
        const { letterId } = data;
        if (!letterId) throw new Error('missing letterId');
        const res = await db
          .collection('help_replies')
          .where({
            letterId,
            status: 'active'
          })
          .orderBy('createdAt', 'asc')
          .get();
        return { ok: true, list: res.data || [] };
      }

      /**
       * 更新社区帖子的标签计数
       * data: { id, communityTags }
       */
      case 'updateCommunityTags': {
        const { id, communityTags } = data;
        if (!id) throw new Error('missing id');
        const res = await db
          .collection('letters')
          .where({
            id,
            type: 'display',
            published: true
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const docId = res.data[0]._id;
        await db.collection('letters').doc(docId).update({
          data: { communityTags }
        });
        return { ok: true };
      }

      /**
       * 添加社区短评
       * data: { id, comment }
       */
      case 'addComment': {
        const { id, comment } = data;
        if (!id || !comment) throw new Error('missing id or comment');
        const res = await db
          .collection('letters')
          .where({
            id,
            type: 'display',
            published: true
          })
          .get();
        if (!res.data || !res.data.length) {
          throw new Error('letter not found');
        }
        const doc = res.data[0];
        const docId = doc._id;
        const comments = doc.comments || [];
        comments.push({
          id: `comment_${Date.now()}`,
          text: comment.text,
          time: Date.now()
        });
        await db.collection('letters').doc(docId).update({
          data: { comments }
        });
        return { ok: true };
      }
      
      case 'seedDemo': {
        const fmt = (d) => {
          const y = d.getFullYear();
          const m = `${d.getMonth() + 1}`.padStart(2, '0');
          const day = `${d.getDate()}`.padStart(2, '0');
          return `${y}-${m}-${day}`;
        };
        const addDays = (base, n) => {
          const d = new Date(base.getTime());
          d.setDate(d.getDate() + n);
          return fmt(d);
        };
        const now = Date.now();
        const today = new Date();
        const me = wxContext.OPENID;
        const other1 = 'DEMO_OTHER_OPENID_1';
        const other2 = 'DEMO_OTHER_OPENID_2';
        const exist = await db
          .collection('letters')
          .where({
            id: db.RegExp({ regexp: '^demo_', options: 'i' })
          })
          .count();
        if (exist && exist.total > 0) {
          return { ok: true, inserted: 0, skipped: true };
        }
        const docs = [
          {
            id: 'demo_future_1',
            title: '写给未来的我：一周后的心愿',
            content: '希望你能保持热爱，睡得更好，吃得更香。',
            targetDate: addDays(today, 7),
            createdAt: now - 3 * 86400000,
            mood: 'hopeful',
            shareable: true,
            remindEnabled: false,
            published: false,
            type: 'future',
            status: 'active',
            likeCount: 0,
            _openid: me
          },
          {
            id: 'demo_future_2',
            title: '今天寄出的信',
            content: '给今天的自己一个拥抱，未来会更好。',
            targetDate: addDays(today, 0),
            createdAt: now - 1 * 86400000,
            mood: 'peace',
            shareable: false,
            remindEnabled: false,
            published: false,
            type: 'future',
            status: 'active',
            likeCount: 0,
            _openid: me
          },
          {
            id: 'demo_past_1',
            title: '上周的我',
            content: '这一周发生了很多事，感谢一直坚持的自己。',
            targetDate: addDays(today, -3),
            createdAt: now - 10 * 86400000,
            mood: 'tired',
            shareable: true,
            remindEnabled: false,
            published: false,
            type: 'future',
            status: 'active',
            likeCount: 0,
            _openid: me
          },
          {
            id: 'demo_community_1',
            title: '匿名来信：给明年的自己',
            content: '愿你如愿以偿，所有期待都被温柔以待。',
            targetDate: addDays(today, 30),
            createdAt: now - 2 * 86400000,
            mood: 'hopeful',
            shareable: true,
            remindEnabled: false,
            published: true,
            type: 'display',
            status: 'active',
            likeCount: 12,
            _openid: other1
          },
          {
            id: 'demo_community_2',
            title: '匿名来信：给正在努力的你',
            content: '请相信微小而持续的改变会汇成光。',
            targetDate: addDays(today, 15),
            createdAt: now - 5 * 86400000,
            mood: 'excited',
            shareable: true,
            remindEnabled: false,
            published: true,
            type: 'display',
            status: 'active',
            likeCount: 3,
            _openid: other2
          },
          {
            id: 'demo_help_me_1',
            title: '当下的小烦恼',
            content: '最近有点焦虑，想听听你的建议。',
            createdAt: now - 1 * 86400000,
            type: 'help',
            status: 'active',
            replyCount: 0,
            _openid: me
          },
          {
            id: 'demo_help_other_1',
            title: '求助：如何调整作息',
            content: '总是晚睡影响白天状态，怎么办？',
            createdAt: now - 2 * 86400000,
            type: 'help',
            status: 'active',
            replyCount: 0,
            _openid: other1
          }
        ];
        const addLetter = (d) =>
          db.collection('letters').add({
            data: d
          });
        await Promise.all(docs.map(addLetter));
        const replies = [
          {
            letterId: 'demo_help_me_1',
            _openid: other1,
            content: '先试试固定上床和起床时间，给自己一个仪式感。',
            createdAt: now - 6 * 3600000,
            status: 'active'
          },
          {
            letterId: 'demo_help_other_1',
            _openid: me,
            content: '从30分钟提前开始，逐步调整会更容易坚持。',
            createdAt: now - 3 * 3600000,
            status: 'active'
          }
        ];
        const addReply = (r) =>
          db.collection('help_replies').add({
            data: r
          });
        await Promise.all(replies.map(addReply));
        await db
          .collection('letters')
          .where({ id: 'demo_help_me_1' })
          .update({ data: { replyCount: _.inc(1) } });
        await db
          .collection('letters')
          .where({ id: 'demo_help_other_1' })
          .update({ data: { replyCount: _.inc(1) } });
        return { ok: true, inserted: docs.length + replies.length };
      }

      /**
       * ==================== 用户管理 ====================
       */

      /**
       * 获取或创建用户信息
       */
      case 'getUserInfo': {
        const res = await db
          .collection('users')
          .where({ _openid: wxContext.OPENID })
          .get();
        
        if (res.data && res.data.length > 0) {
          return { ok: true, user: res.data[0] };
        }
        
        // 创建新用户
        const now = Date.now();
        const newUser = {
          _openid: wxContext.OPENID,
          nickName: '新用户',
          avatarUrl: '',
          phoneNumber: '',
          gender: 0,
          points: 0,
          level: 1,
          continuousDays: 0,
          totalPoints: 0,
          achievements: [],
          unlockedAchievements: [],
          claimedAchievementRewards: [],
          createdAt: now,
          updatedAt: now
        };
        
        const addRes = await db.collection('users').add({ data: newUser });
        newUser._id = addRes._id;
        return { ok: true, user: newUser };
      }

      /**
       * 更新用户信息
       * data: { updates }
       */
      case 'updateUserInfo': {
        const { updates } = data;
        if (!updates) throw new Error('missing updates');
        
        const res = await db
          .collection('users')
          .where({ _openid: wxContext.OPENID })
          .get();
        
        if (!res.data || !res.data.length) {
          throw new Error('user not found');
        }
        
        await db.collection('users').doc(res.data[0]._id).update({
          data: {
            ...updates,
            updatedAt: Date.now()
          }
        });
        
        return { ok: true };
      }

      /**
       * 增加用户积分
       * data: { points, reason }
       */
      case 'addPoints': {
        const { points, reason } = data;
        if (!points) throw new Error('missing points');
        
        const res = await db
          .collection('users')
          .where({ _openid: wxContext.OPENID })
          .get();
        
        if (!res.data || !res.data.length) {
          throw new Error('user not found');
        }
        
        const userId = res.data[0]._id;
        await db.collection('users').doc(userId).update({
          data: {
            points: _.inc(points),
            totalPoints: _.inc(points),
            updatedAt: Date.now()
          }
        });
        
        // 记录积分历史
        if (db.collection('points_history')) {
          await db.collection('points_history').add({
            data: {
              _openid: wxContext.OPENID,
              points,
              reason: reason || '积分变动',
              createdAt: Date.now()
            }
          });
        }
        
        return { ok: true };
      }

      /**
       * ==================== 用户设置管理 ====================
       */

      /**
       * 获取用户设置
       */
      case 'getUserSettings': {
        const res = await db
          .collection('user_settings')
          .where({ _openid: wxContext.OPENID })
          .get();
        
        if (res.data && res.data.length > 0) {
          return { ok: true, settings: res.data[0] };
        }
        
        // 创建默认设置
        const defaultSettings = {
          _openid: wxContext.OPENID,
          notificationSettings: {
            enableNotification: true,
            enableResonance: true,
            enableComment: true,
            enableReply: true,
            enableReminder: true,
            enableNightMode: false
          },
          privacySettings: {
            allowSearch: true,
            showOnline: true,
            allowStrangerMessage: true
          },
          preferences: {
            theme: 'light',
            fontSize: 'medium',
            language: 'zh-CN'
          },
          nightModeTime: {
            start: '22:00',
            end: '08:00'
          }
        };
        
        const addRes = await db.collection('user_settings').add({ data: defaultSettings });
        defaultSettings._id = addRes._id;
        return { ok: true, settings: defaultSettings };
      }

      /**
       * 更新用户设置
       * data: { updates }
       */
      case 'updateUserSettings': {
        const { updates } = data;
        if (!updates) throw new Error('missing updates');
        
        const res = await db
          .collection('user_settings')
          .where({ _openid: wxContext.OPENID })
          .get();
        
        if (!res.data || !res.data.length) {
          // 创建新设置
          await db.collection('user_settings').add({
            data: {
              _openid: wxContext.OPENID,
              ...updates
            }
          });
        } else {
          // 更新现有设置
          await db.collection('user_settings').doc(res.data[0]._id).update({
            data: updates
          });
        }
        
        return { ok: true };
      }

      default:
        return { ok: false, error: 'unknown action' };
    }
  } catch (err) {
    console.error('letters function error', action, err);
    return { ok: false, error: err.message || 'internal error' };
  }
};
