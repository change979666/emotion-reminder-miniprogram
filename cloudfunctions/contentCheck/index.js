const cloud = require('wx-server-sdk');
cloud.init({ 
  env: cloud.DYNAMIC_CURRENT_ENV,
  traceUser: true
});

/**
 * 内容安全审核云函数
 * 使用微信官方的内容安全接口检测用户生成的文本内容
 * 个人版小程序免费使用，是合规的核心要求
 */
exports.main = async (event, context) => {
  const { content, type = 'text' } = event;
  
  // 验证参数
  if (!content || typeof content !== 'string') {
    return {
      ok: false,
      errCode: 'INVALID_PARAM',
      errMsg: '内容不能为空'
    };
  }

  // 内容长度限制（微信接口限制为 500 字以内）
  if (content.length > 500) {
    // 如果内容超过 500 字，分段检测
    const chunks = [];
    for (let i = 0; i < content.length; i += 500) {
      chunks.push(content.slice(i, i + 500));
    }
    
    // 检测每一段
    for (const chunk of chunks) {
      const result = await checkContent(chunk);
      if (!result.ok) {
        return result;
      }
    }
    
    return { ok: true, errCode: 0, errMsg: 'ok' };
  }

  // 单次检测
  return await checkContent(content);
};

/**
 * 调用微信内容安全接口
 */
async function checkContent(text) {
  try {
    const result = await cloud.openapi.security.msgSecCheck({
      content: text,
      version: 2, // 使用 v2 版本（更准确）
      scene: 1,   // 场景值：1-资料；2-评论；3-论坛；4-社交日志
      openid: cloud.getWXContext().OPENID
    });

    // 检测结果说明：
    // errCode: 0 - 内容正常
    // errCode: 87014 - 内容含有违法违规内容
    if (result.errCode === 0) {
      // 进一步检查 result 字段
      const { result: checkResult } = result;
      
      if (checkResult && checkResult.suggest === 'risky') {
        // 内容可能违规
        return {
          ok: false,
          errCode: 'CONTENT_RISKY',
          errMsg: '内容可能包含不当信息，请修改后重试',
          detail: checkResult
        };
      }
      
      return {
        ok: true,
        errCode: 0,
        errMsg: 'ok'
      };
    } else if (result.errCode === 87014) {
      // 内容违规
      return {
        ok: false,
        errCode: 'CONTENT_ILLEGAL',
        errMsg: '内容包含违规信息，请修改后重试'
      };
    } else {
      // 其他错误
      return {
        ok: false,
        errCode: result.errCode,
        errMsg: result.errMsg || '内容审核失败'
      };
    }
  } catch (error) {
    console.error('msgSecCheck error:', error);
    
    // 如果是接口调用失败（如配额用尽），返回特定错误
    if (error.errCode === 87014) {
      return {
        ok: false,
        errCode: 'CONTENT_ILLEGAL',
        errMsg: '内容包含违规信息，请修改后重试'
      };
    }
    
    // 其他错误，为了不影响用户体验，可以选择放行
    // 但建议记录日志，人工审核
    console.error('Content check error, but allow pass:', error);
    return {
      ok: true,
      errCode: 0,
      errMsg: 'ok (fallback)',
      warning: 'check_failed'
    };
  }
}
