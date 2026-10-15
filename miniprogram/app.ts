/**
 * @file 小程序入口文件
 */

import { CLOUD_ENV_ID } from './config';

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化云开发
    if (CLOUD_ENV_ID && (wx as any).cloud && typeof (wx as any).cloud.init === 'function') {
      (wx as any).cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      });
    }

    // 展示本地存储能力（示例）
    const logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);

    // 登录（如需后端换取 session，可在此基础上扩展）
    wx.login({
      success: (res) => {
        console.log(res.code);
      }
    });
  }
});
