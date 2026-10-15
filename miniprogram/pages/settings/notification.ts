/**
 * @file 提醒设置页
 */

Page({
  data: {
    notificationSettings: {
      letterArrival: true,
      replyNotice: true,
      systemMessage: true,
      nightMode: false
    },
    nightModeTime: {
      start: '22:00',
      end: '08:00'
    }
  },

  onLoad() {
    this.loadNotificationSettings();
  },

  /**
   * 加载提醒设置
   */
  async loadNotificationSettings() {
    try {
      const res = await (wx as any).cloud.callFunction({
        name: 'letters',
        data: {
          action: 'getUserSettings',
          data: {}
        }
      });
      
      if (res.result?.ok && res.result.settings) {
        const settings = res.result.settings;
        this.setData({
          notificationSettings: settings.notificationSettings || {
            letterArrival: true,
            replyNotice: true,
            systemMessage: true,
            nightMode: false
          },
          nightModeTime: settings.nightModeTime || {
            start: '22:00',
            end: '08:00'
          }
        });
      }
    } catch (error) {
      console.error('Load notification settings error:', error);
    }
  },

  /**
   * 切换提醒设置
   */
  async onNotificationChange(e: WechatMiniprogram.SwitchChange) {
    const { key } = e.currentTarget.dataset as { key: string };
    const value = e.detail.value;
    
    this.setData({
      [`notificationSettings.${key}`]: value
    });
    
    try {
      await (wx as any).cloud.callFunction({
        name: 'letters',
        data: {
          action: 'updateUserSettings',
          data: {
            updates: {
              notificationSettings: this.data.notificationSettings
            }
          }
        }
      });
      wx.showToast({ title: '设置已保存', icon: 'success', duration: 1500 });
    } catch (error) {
      console.error('Save notification settings error:', error);
      wx.showToast({ title: '保存失败', icon: 'error' });
    }
  },

  /**
   * 勿扰时间段选择
   */
  async onTimeChange(e: WechatMiniprogram.PickerChange) {
    const { type } = e.currentTarget.dataset as { type: 'start' | 'end' };
    const value = e.detail.value;
    
    this.setData({
      [`nightModeTime.${type}`]: value
    });
    
    try {
      await (wx as any).cloud.callFunction({
        name: 'letters',
        data: {
          action: 'updateUserSettings',
          data: {
            updates: {
              nightModeTime: this.data.nightModeTime
            }
          }
        }
      });
      wx.showToast({ title: '时间已更新', icon: 'success', duration: 1500 });
    } catch (error) {
      console.error('Save night mode time error:', error);
      wx.showToast({ title: '保存失败', icon: 'error' });
    }
  }
});
