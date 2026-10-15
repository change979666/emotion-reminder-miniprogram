/**
 * @file seed 云函数：初始化示例数据（letters/help_replies）
 * 使用方式：在云开发面板部署后调用，传入 { count?: number }
 */

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const moods = ['hopeful', 'anxious', 'tired', 'peace', 'excited'];
const titles = ['写给未来的我', '今天有点累', '小小的期待', '想对你说', '把心事放进未来'];
const contents = [
  '今天的我有点迷茫，但也在努力往前走。',
  '希望未来的你依然温柔坚定。',
  '把这段话留给未来的某一天。',
  '如果你看见这封信，说明你已经更强了。',
  '愿你一切都好，也愿你仍有勇气。'
];
const helpTitles = ['最近好难过', '有点焦虑', '很想被理解', '压力有点大', '想有人听我说说'];
const helpContents = [
  '最近事情很多，我有点喘不过气。',
  '总是担心未来，不知道该怎么放松。',
  '有些话不知道对谁说。',
  '感觉努力了但没有回报。',
  '希望能有人给我一点鼓励。'
];
const replyContents = [
  '你已经很努力了，抱抱你。',
  '慢一点也没关系，照顾好自己。',
  '我在这里听你说。',
  '愿你今天能轻松一点。',
  '给自己一点时间，都会好起来的。'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

exports.main = async (event, context) => {
  const { count = 6 } = event || {};
  const wxContext = cloud.getWXContext();
  const now = Date.now();

  const letters = [];
  const helps = [];

  for (let i = 0; i < count; i += 1) {
    letters.push({
      id: `seed_${now}_${i}`,
      title: pick(titles),
      content: pick(contents),
      targetDate: getDateStr(i + 1),
      createdAt: now - i * 3600 * 1000,
      mood: pick(moods),
      shareable: true,  // 改为全部可分享
      published: true,  // 改为全部已发布
      remindEnabled: false,
      type: 'future',
      status: 'active',
      likeCount: Math.floor(Math.random() * 20),
      replyCount: 0,
      reminderSent: false,
      _openid: wxContext.OPENID
    });
  }

  for (let i = 0; i < Math.max(3, Math.floor(count / 2)); i += 1) {
    helps.push({
      id: `${now}_help_${i}`,
      title: pick(helpTitles),
      content: pick(helpContents),
      createdAt: now - i * 7200 * 1000,
      type: 'help',
      status: 'active',
      replyCount: 0,
      _openid: wxContext.OPENID
    });
  }

  // 批量添加信件
  const addPromises = [];
  for (const item of letters) {
    addPromises.push(
      db.collection('letters').add({ data: item })
    );
  }
  for (const item of helps) {
    addPromises.push(
      db.collection('letters').add({ data: item })
    );
  }
  await Promise.all(addPromises);

  // 给第一封求助信加几条回复
  if (helps.length) {
    const replyCount = 3;
    const replyPromises = [];
    for (let i = 0; i < replyCount; i += 1) {
      replyPromises.push(
        db.collection('help_replies').add({
          data: {
            letterId: helps[0].id,
            _openid: wxContext.OPENID,
            content: pick(replyContents),
            createdAt: now - i * 1800 * 1000,
            status: 'active'
          }
        })
      );
    }
    await Promise.all(replyPromises);
    
    // 更新求助信回复数
    const res = await db
      .collection('letters')
      .where({ id: helps[0].id, type: 'help' })
      .get();
    if (res.data && res.data.length) {
      await db.collection('letters').doc(res.data[0]._id).update({
        data: { replyCount }
      });
    }
  }

  return { ok: true, letters: letters.length, helps: helps.length };
};
