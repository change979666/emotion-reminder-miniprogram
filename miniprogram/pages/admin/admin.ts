/**
 * @file 管理页面 - 生成测试数据
 */

import { STICKER_DATA } from '../../config/stickers';

Component({
  data: {
    letterCount: 10,
    generating: false,
    initingStickers: false,
    statusMessage: '',
    statusType: 'success'
  },

  lifetimes: {
    attached() {
      // 检查是否为开发环境
      const accountInfo = wx.getAccountInfoSync();
      if (accountInfo.miniProgram.envVersion !== 'develop') {
        wx.showModal({
          title: '提示',
          content: '此功能仅在开发版本可用',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      }
    }
  },

  methods: {
    /**
     * 信件数量变化
     */
    onLetterCountChange(e: WechatMiniprogram.SliderChange) {
      this.setData({ letterCount: e.detail.value });
    },

    /**
     * 生成测试数据
     */
    async generateData() {
      this.setData({ 
        generating: true,
        statusMessage: '',
        statusType: 'success'
      });

      try {
        // 调用 seed 云函数
        const res = await (wx as any).cloud.callFunction({
          name: 'seed',
          data: {
            count: this.data.letterCount
          }
        });

        if (res.result && res.result.ok) {
          this.setData({
            statusMessage: `✅ 成功生成 ${res.result.letters} 封信件和 ${res.result.helps} 封求助信`,
            statusType: 'success'
          });
          
          wx.showToast({
            title: '数据生成成功！',
            icon: 'success'
          });

          // 3秒后自动返回
          setTimeout(() => {
            wx.navigateBack();
          }, 3000);
        } else {
          throw new Error('生成失败');
        }
      } catch (error) {
        console.error('Generate data error:', error);
        this.setData({
          statusMessage: '❌ 生成失败：' + (error as Error).message,
          statusType: 'error'
        });
        wx.showToast({
          title: '生成失败，请重试',
          icon: 'none'
        });
      } finally {
        this.setData({ generating: false });
      }
    },

    /**
     * 清空本地数据
     */
    clearLocalData() {
      wx.showModal({
        title: '确认清空',
        content: '将清空所有本地缓存数据（不影响云端数据）',
        success: (res) => {
          if (res.confirm) {
            try {
              wx.clearStorageSync();
              wx.showToast({
                title: '本地数据已清空',
                icon: 'success'
              });
              this.setData({
                statusMessage: '✅ 本地数据已清空',
                statusType: 'success'
              });
            } catch (error) {
              console.error('Clear data error:', error);
              wx.showToast({
                title: '清空失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },

    /**
     * 初始化贴纸数据
     */
    async initStickers() {
      this.setData({ 
        initingStickers: true,
        statusMessage: '',
        statusType: 'success'
      });

      try {
        // 调用 stickers 云函数初始化数据
        const res = await (wx as any).cloud.callFunction({
          name: 'stickers',
          data: {
            action: 'initStickers',
            data: { stickers: STICKER_DATA }
          }
        });

        if (res.result.success) {
          wx.showToast({
            title: '初始化成功',
            icon: 'success'
          });
          this.setData({
            statusMessage: `✅ 已初始化 ${STICKER_DATA.length} 个贴纸`,
            statusType: 'success'
          });
        } else {
          throw new Error(res.result.message || '初始化失败');
        }
      } catch (error: any) {
        console.error('Init stickers error:', error);
        wx.showToast({
          title: error.message || '初始化失败',
          icon: 'none'
        });
        this.setData({
          statusMessage: `❌ 初始化失败: ${error.message}`,
          statusType: 'error'
        });
      } finally {
        this.setData({ initingStickers: false });
      }
    }
  }
});
