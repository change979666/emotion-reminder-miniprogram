/**
 * @file 联系客服/反馈页
 */

Page({
  data: {
    feedbackType: '功能建议',
    feedbackTypes: ['功能建议', '问题反馈', '内容举报', '其他'],
    content: '',
    contact: ''
  },

  /**
   * 选择反馈类型
   */
  onTypeChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value);
    this.setData({
      feedbackType: this.data.feedbackTypes[index]
    });
  },

  /**
   * 内容输入
   */
  onContentInput(e: WechatMiniprogram.Input) {
    this.setData({
      content: e.detail.value
    });
  },

  /**
   * 联系方式输入
   */
  onContactInput(e: WechatMiniprogram.Input) {
    this.setData({
      contact: e.detail.value
    });
  },

  /**
   * 提交反馈
   */
  submitFeedback() {
    const { feedbackType, content, contact } = this.data;

    if (!content.trim()) {
      wx.showToast({
        title: '写下你的问题或建议吧～',
        icon: 'none'
      });
      return;
    }

    // 保存反馈到本地（实际项目中应该提交到服务器）
    const feedbacks = wx.getStorageSync('feedbacks') || [];
    feedbacks.push({
      type: feedbackType,
      content,
      contact,
      createTime: new Date().getTime()
    });
    wx.setStorageSync('feedbacks', feedbacks);

    wx.showToast({
      title: '谢谢你的反馈，我们会认真看见～',
      icon: 'success',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 2000);
      }
    });
  }
});
