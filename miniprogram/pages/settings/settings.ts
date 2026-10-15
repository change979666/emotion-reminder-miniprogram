/**
 * @file 设置页面
 */

import { getOrInitUserId, getStoredPhone } from '../../utils/util';

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '微信用户'
    },
    userId: '',
    userPhone: '',
    version: '1.0.0',
    isDev: false
  },

  onLoad() {
    // 检查是否为开发环境
    const accountInfo = wx.getAccountInfoSync();
    this.setData({ 
      isDev: accountInfo.miniProgram.envVersion === 'develop' 
    });
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      // 先尝试从云端加载
      try {
        const res = await (wx as any).cloud.callFunction({
          name: 'letters',
          data: {
            action: 'getUserInfo',
            data: {}
          }
        });
        
        if (res.result?.ok && res.result.user) {
          const user = res.result.user;
          const userInfo = {
            avatarUrl: user.avatarUrl || defaultAvatarUrl,
            nickName: user.nickName || '微信用户'
          };
          
          // 保存到本地存储
          wx.setStorageSync('userInfo', userInfo);
          
          const userId = await getOrInitUserId();
          const userPhone = getStoredPhone();

          this.setData({
            userInfo,
            userId,
            userPhone
          });
          return;
        }
      } catch (cloudError) {
        console.log('Cloud function not available, using local storage');
      }
      
      // 云端加载失败，从本地存储加载
      const userInfo = wx.getStorageSync('userInfo') || {
        avatarUrl: defaultAvatarUrl,
        nickName: '微信用户'
      };
      
      const userId = await getOrInitUserId();
      const userPhone = getStoredPhone();

      this.setData({
        userInfo,
        userId,
        userPhone
      });
    } catch (error) {
      console.error('load user info error', error);
    }
  },

  /**
   * 跳转到个人资料页
   */
  goToProfile() {
    wx.navigateTo({ url: '/pages/settings/profile' });
  },

  /**
   * 跳转到提醒设置页
   */
  goToNotification() {
    wx.navigateTo({ url: '/pages/settings/notification' });
  },

  /**
   * 跳转到账号与隐私页
   */
  goToAccount() {
    wx.navigateTo({ url: '/pages/settings/account' });
  },

  /**
   * 跳转到偏好设置页
   */
  goToPreferences() {
    wx.navigateTo({ url: '/pages/settings/preferences' });
  },

  /**
   * 跳转到平台协议页
   */
  goToAgreement() {
    wx.navigateTo({ url: '/pages/settings/agreement' });
  },

  /**
   * 跳转到关于我们页
   */
  goToAbout() {
    wx.navigateTo({ url: '/pages/settings/about' });
  },

  /**
   * 跳转到联系客服页
   */
  goToContact() {
    wx.navigateTo({ url: '/pages/settings/contact' });
  },

  /**
   * 跳转到数据管理页（仅开发环境）
   */
  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后将清除本地数据，是否继续？',
      confirmText: '退出',
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.clearStorageSync();
          wx.showToast({ title: '已退出', icon: 'success' });
          
          // 延迟返回首页
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1500);
        }
      }
    });
  }
});
