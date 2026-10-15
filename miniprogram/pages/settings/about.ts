/**
 * @file 关于我们页
 */

Page({
  data: {
    appName: '轻量化情感提醒助手',
    version: 'v1.0.0',
    updateDate: '2026.01.16',
    features: [
      { icon: '✏️', title: '写给未来', desc: '将今天的心情寄给未来的自己' },
      { icon: '📮', title: '定时送达', desc: '在指定的日期收到来自过去的信' },
      { icon: '💬', title: '解忧杂货铺', desc: '匿名倾诉，收获温暖回复' },
      { icon: '🔒', title: '隐私保护', desc: '本地存储，数据安全有保障' }
    ]
  },

  /**
   * 检查更新
   */
  checkUpdate() {
    wx.showToast({
      title: '已是最新版本',
      icon: 'success'
    });
  }
});
