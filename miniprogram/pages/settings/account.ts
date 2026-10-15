/**
 * @file 账号与隐私设置页
 */

import { getOrInitUserId, getStoredPhone, getEncryptKey, setEncryptKey } from '../../utils/util';

function generateShortId(longId: string): string {
  if (!longId) return '000000';
  const numStr = longId.replace(/\D/g, '');
  if (numStr.length >= 6) {
    return numStr.slice(-6);
  }
  let hash = 0;
  for (let i = 0; i < longId.length; i++) {
    hash = ((hash << 5) - hash) + longId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString().padStart(6, '0').slice(0, 6);
}

Page({
  data: {
    userId: '',
    shortUserId: '',
    userPhone: '',
    encryptKey: '',
    privacySettings: {
      allowSearch: true,
      showOnlineStatus: true,
      allowStrangerMessage: false
    }
  },

  onLoad() {
    this.loadAccountInfo();
    this.loadPrivacySettings();
    this.loadEncryptKey();
  },

  /**
   * 加载账号信息
   */
  async loadAccountInfo() {
    try {
      const userId = await getOrInitUserId();
      const shortUserId = generateShortId(userId);
      const userPhone = getStoredPhone();

      this.setData({
        userId,
        shortUserId,
        userPhone
      });
    } catch (error) {
      console.error('load account info error', error);
    }
  },

  /**
   * 加载隐私设置
   */
  async loadPrivacySettings() {
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
          privacySettings: settings.privacySettings || {
            allowSearch: true,
            showOnlineStatus: true,
            allowStrangerMessage: false
          }
        });
      }
    } catch (error) {
      console.error('Load privacy settings error:', error);
    }
  },

  /**
   * 加载加密口令
   */
  loadEncryptKey() {
    const encryptKey = getEncryptKey();
    this.setData({ encryptKey });
  },

  /**
   * 复制ID
   */
  copyUserId() {
    wx.setClipboardData({
      data: this.data.shortUserId,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  /**
   * 获取手机号
   */
  async onGetPhoneNumber(e: WechatMiniprogram.ButtonGetPhoneNumber) {
    try {
      const detail = (e.detail as any) || {};
      const code = detail.code;
      if (!code) {
        wx.showToast({ title: '未获取到授权码', icon: 'none' });
        return;
      }
      // 云函数未开启，使用模拟数据
      wx.showToast({ title: '手机号绑定功能暂未开放', icon: 'none' });
    } catch (error) {
      console.error('get phone error', error);
    }
  },

  /**
   * 切换隐私设置
   */
  async onPrivacyChange(e: WechatMiniprogram.SwitchChange) {
    const { key } = e.currentTarget.dataset as { key: string };
    const value = e.detail.value;
    
    this.setData({
      [`privacySettings.${key}`]: value
    });
    
    try {
      await (wx as any).cloud.callFunction({
        name: 'letters',
        data: {
          action: 'updateUserSettings',
          data: {
            updates: {
              privacySettings: this.data.privacySettings
            }
          }
        }
      });
      wx.showToast({ title: '设置已保存', icon: 'success', duration: 1500 });
    } catch (error) {
      console.error('Save privacy settings error:', error);
      wx.showToast({ title: '保存失败', icon: 'error' });
    }
  },

  /**
   * 加密口令输入
   */
  onEncryptKeyInput(e: WechatMiniprogram.Input) {
    this.setData({ encryptKey: e.detail.value || '' });
  },

  /**
   * 保存加密口令
   */
  onSaveEncryptKey() {
    setEncryptKey(this.data.encryptKey);
    wx.showToast({ title: '口令已保存', icon: 'success', duration: 1500 });
  }
});
