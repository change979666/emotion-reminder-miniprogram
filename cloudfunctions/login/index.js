/**
 * @file login 云函数：获取用户 openid 和 IP
 */

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  
  // 获取用户IP（如果可用）
  const sourceIP = wxContext.SOURCE_IP || event.userInfo?.sourceIP || '';
  
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID || '',
    sourceIP: sourceIP
  };
};

