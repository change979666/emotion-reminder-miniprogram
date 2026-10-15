/**
 * @file phone 云函数：通过 openapi 获取用户手机号
 * 需要在云函数权限中开启 openapi:phonenumber.getPhoneNumber
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { code } = event || {};
  if (!code) {
    return { ok: false, error: 'missing code' };
  }
  try {
    const res = await cloud.openapi.phonenumber.getPhoneNumber({ code });
    const phoneInfo = res?.phoneInfo || {};
    const phoneNumber = phoneInfo?.purePhoneNumber || phoneInfo?.phoneNumber || '';
    return { ok: true, phoneNumber, phoneInfo };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : 'unknown error' };
  }
};
