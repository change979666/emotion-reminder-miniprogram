/**
 * @file reminder 云函数：定时扫描到期信件并发送订阅消息提醒
 *
 * 依赖：
 * - 云数据库集合：letters
 * - 字段：targetDate(YYYY-MM-DD)、remindEnabled、reminderSent、_openid
 *
 * 配置：
 * - 订阅消息模板ID通过环境变量 REMINDER_TEMPLATE_ID 传入（云函数配置里设置）
 */

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * 获取今天日期字符串 YYYY-MM-DD（按云函数运行时区，默认中国时区一般 OK）
 */
function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

exports.main = async () => {
  const templateId = process.env.REMINDER_TEMPLATE_ID || '';
  if (!templateId) {
    return { ok: false, reason: 'missing REMINDER_TEMPLATE_ID env' };
  }

  const today = getTodayStr();

  // 拉取今天到期且未发送的信件
  const res = await db
    .collection('letters')
    .where({
      targetDate: today,
      remindEnabled: true,
      reminderSent: false
    })
    .limit(100)
    .get();

  const letters = res.data || [];
  let successCount = 0;
  let failCount = 0;

  for (const letter of letters) {
    try {
      // 发送一次性订阅消息
      await cloud.openapi.subscribeMessage.send({
        touser: letter._openid,
        templateId,
        page: 'pages/letters/letters',
        data: {
          // 注意：这里的 key 需要与你的模板字段名匹配（请在模板里确认）
          thing1: { value: (letter.title || '写给未来的我').slice(0, 20) },
          date2: { value: today },
          thing3: { value: '你的未来信已抵达，记得去拆开。' }
        }
      });

      await db.collection('letters').doc(letter._id).update({
        data: {
          reminderSent: true,
          reminderSentAt: Date.now()
        }
      });
      successCount += 1;
    } catch (e) {
      failCount += 1;
    }
  }

  return { ok: true, today, total: letters.length, successCount, failCount };
};

