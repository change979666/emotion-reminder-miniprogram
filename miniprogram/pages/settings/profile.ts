/**
 * @file 个人资料编辑页
 */

const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
      signature: ''
    }
  },

  onLoad() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  async loadUserInfo() {
    try {
      // 从云端加载
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
          nickName: user.nickName || '微信用户',
          signature: user.signature || '这个人很懒，什么都没写'
        };
        
        // 同步到本地存储
        wx.setStorageSync('userInfo', userInfo);
        
        this.setData({ userInfo });
      } else {
        // 云端没有数据，从本地存储读取
        const localUserInfo = wx.getStorageSync('userInfo');
        if (localUserInfo) {
          this.setData({
            userInfo: {
              avatarUrl: localUserInfo.avatarUrl || defaultAvatarUrl,
              nickName: localUserInfo.nickName || '微信用户',
              signature: localUserInfo.signature || '这个人很懒，什么都没写'
            }
          });
        }
      }
    } catch (error) {
      console.error('Load user info error:', error);
      // 云函数调用失败，从本地存储读取
      const localUserInfo = wx.getStorageSync('userInfo');
      if (localUserInfo) {
        this.setData({
          userInfo: {
            avatarUrl: localUserInfo.avatarUrl || defaultAvatarUrl,
            nickName: localUserInfo.nickName || '微信用户',
            signature: localUserInfo.signature || '这个人很懒，什么都没写'
          }
        });
      }
    }
  },

  /**
   * 选择头像
   */
  async onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
    const { avatarUrl } = (e.detail || {}) as { avatarUrl?: string };
    if (avatarUrl) {
      this.setData({
        'userInfo.avatarUrl': avatarUrl
      });
      await this.saveUserInfo();
    }
  },

  /**
   * 昵称输入
   */
  onNicknameInput(e: WechatMiniprogram.Input) {
    const nickName = e.detail.value || '';
    this.setData({
      'userInfo.nickName': nickName
    });
  },

  /**
   * 昵称输入完成
   */
  async onNicknameBlur() {
    await this.saveUserInfo();
  },

  /**
   * 个性签名聚焦
   */
  onSignatureFocus() {
    const defaultSignature = '这个人很懒，什么都没写';
    if (this.data.userInfo.signature === defaultSignature) {
      this.setData({
        'userInfo.signature': ''
      });
    }
  },

  /**
   * 个性签名输入
   */
  onSignatureInput(e: WechatMiniprogram.Input) {
    const signature = e.detail.value || '';
    this.setData({
      'userInfo.signature': signature
    });
  },

  /**
   * 个性签名输入完成
   */
  async onSignatureBlur() {
    const defaultSignature = '这个人很懒，什么都没写';
    if (!this.data.userInfo.signature || this.data.userInfo.signature.trim() === '') {
      this.setData({
        'userInfo.signature': defaultSignature
      });
    }
    await this.saveUserInfo();
  },

  /**
   * 保存用户信息
   */
  async saveUserInfo() {
    try {
      const updates = {
        avatarUrl: this.data.userInfo.avatarUrl,
        nickName: this.data.userInfo.nickName,
        signature: this.data.userInfo.signature
      };
      
      // 同步到本地存储
      wx.setStorageSync('userInfo', updates);
      
      // 保存到云端
      const res = await (wx as any).cloud.callFunction({
        name: 'letters',
        data: {
          action: 'updateUserInfo',
          data: { updates }
        }
      });
      
      if (res.result?.ok) {
        wx.showToast({ title: '保存成功', icon: 'success', duration: 1500 });
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      console.error('Save user info error:', error);
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'error' });
    }
  }
});
