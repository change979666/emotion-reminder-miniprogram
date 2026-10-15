/**
 * @file 偏好设置页
 */

Page({
  data: {
    preferences: {
      defaultMood: '平静',
      fontSize: 'medium',
      darkMode: false,
      autoSave: true
    },
    moodOptions: ['开心', '平静', '难过', '兴奋', '焦虑', '感恩'],
    fontSizeOptions: [
      { label: '小', value: 'small' },
      { label: '中', value: 'medium' },
      { label: '大', value: 'large' }
    ]
  },

  onLoad() {
    this.loadPreferences();
  },

  /**
   * 加载偏好设置
   */
  async loadPreferences() {
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
          preferences: settings.preferences || {
            defaultMood: '平静',
            fontSize: 'medium',
            darkMode: false,
            autoSave: true
          }
        });
      }
    } catch (error) {
      console.error('Load preferences error:', error);
    }
  },

  /**
   * 选择默认心情
   */
  async onMoodChange(e: WechatMiniprogram.PickerChange) {
    const index = Number(e.detail.value);
    const defaultMood = this.data.moodOptions[index];
    
    this.setData({
      'preferences.defaultMood': defaultMood
    });
    
    await this.savePreferences();
  },

  /**
   * 选择字体大小
   */
  async onFontSizeChange(e: WechatMiniprogram.CustomEvent) {
    const { value } = e.currentTarget.dataset as { value: string };
    
    this.setData({
      'preferences.fontSize': value
    });
    
    await this.savePreferences();
  },

  /**
   * 切换开关设置
   */
  async onSwitchChange(e: WechatMiniprogram.SwitchChange) {
    const { key } = e.currentTarget.dataset as { key: string };
    const value = e.detail.value;
    
    this.setData({
      [`preferences.${key}`]: value
    });
    
    await this.savePreferences();
  },

  /**
   * 保存偏好设置
   */
  async savePreferences() {
    try {
      await (wx as any).cloud.callFunction({
        name: 'letters',
        data: {
          action: 'updateUserSettings',
          data: {
            updates: {
              preferences: this.data.preferences
            }
          }
        }
      });
      wx.showToast({ title: '设置已保存', icon: 'success', duration: 1500 });
    } catch (error) {
      console.error('Save preferences error:', error);
      wx.showToast({ title: '保存失败', icon: 'error' });
    }
  }
});
