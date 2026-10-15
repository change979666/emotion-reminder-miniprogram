/**
 * @file 全局配置
 * 
 * 当前模式：本地存储模式
 * - 所有数据存储在本地（wx.setStorageSync / wx.getStorageSync）
 * - 无需云开发环境，可直接测试功能
 * - 如需切换到云开发模式，请：
 *   1. 取消注释下面的 CLOUD_ENV_ID
 *   2. 在 app.ts 中恢复云开发初始化代码
 *   3. 将所有页面的本地存储调用改为云函数调用
 */

/**
 * 云开发环境 ID
 */
export const CLOUD_ENV_ID = 'cloud1-3g83kychc17f0557';

/**
 * 订阅消息模板 ID（在"公众平台-订阅消息"中创建/获取）
 * - 到期提醒会使用该模板发送
 * - 本地存储模式下暂不启用
 */
export const REMINDER_TEMPLATE_ID = '';

