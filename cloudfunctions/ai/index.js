/**
 * @file AI 云函数：调用各种 AI 服务
 * 
 * 支持的 AI 服务：
 * - OpenAI (GPT-3.5, GPT-4)
 * - DeepSeek (deepseek-chat, deepseek-coder)
 * - 国内 API（通义千问、文心一言、智谱AI等）
 * 
 * 配置方式：
 * 1. 环境变量（推荐）：在云开发控制台配置
 * 2. 代码配置：修改下面的 CONFIG 对象
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const axios = require('axios');

/**
 * AI 服务配置
 * 优先级：环境变量 > 代码配置
 */
const CONFIG = {
  // AI 服务提供商：'openai' | 'deepseek' | 'qwen' | 'wenxin' | 'zhipu' | 'custom'
  provider: process.env.AI_PROVIDER || 'openai',
  
  // API Key（从环境变量获取，如果没有则使用下面的默认值）
  apiKey: process.env.AI_API_KEY || '',
  
  // API 基础地址（某些服务需要自定义地址）
  apiBase: process.env.AI_API_BASE || '',
  
  // 模型名称
  model: process.env.AI_MODEL || 'gpt-3.5-turbo',
  
  // 请求超时时间（毫秒）
  timeout: 30000
};

/**
 * 调用 OpenAI API
 */
async function callOpenAI(prompt, messages) {
  const apiKey = CONFIG.apiKey || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API Key not configured');
  }

  const response = await axios.post(
    CONFIG.apiBase || 'https://api.openai.com/v1/chat/completions',
    {
      model: CONFIG.model || 'gpt-3.5-turbo',
      messages: messages || [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeek(prompt, messages) {
  const apiKey = CONFIG.apiKey || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API Key not configured');
  }

  const response = await axios.post(
    CONFIG.apiBase || 'https://api.deepseek.com/v1/chat/completions',
    {
      model: CONFIG.model || 'deepseek-chat',
      messages: messages || [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * 调用通义千问 API（阿里云）
 */
async function callQwen(prompt, messages) {
  const apiKey = CONFIG.apiKey || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('Qwen API Key not configured');
  }

  // 通义千问 API 地址
  const apiUrl = CONFIG.apiBase || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
  
  const response = await axios.post(
    apiUrl,
    {
      model: CONFIG.model || 'qwen-turbo',
      input: {
        messages: messages || [{ role: 'user', content: prompt }]
      },
      parameters: {
        temperature: 0.7,
        max_tokens: 1000
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout
    }
  );

  return response.data.output.text;
}

/**
 * 调用文心一言 API（百度）
 */
async function callWenxin(prompt, messages) {
  const apiKey = CONFIG.apiKey || process.env.AI_API_KEY;
  const secretKey = process.env.AI_SECRET_KEY || '';
  
  if (!apiKey || !secretKey) {
    throw new Error('Wenxin API Key or Secret Key not configured');
  }

  // 文心一言需要先获取 access_token
  const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
  const tokenRes = await axios.get(tokenUrl);
  const accessToken = tokenRes.data.access_token;

  const response = await axios.post(
    `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`,
    {
      messages: messages || [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_output_tokens: 1000
    },
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout
    }
  );

  return response.data.result;
}

/**
 * 调用智谱AI API
 */
async function callZhipu(prompt, messages) {
  const apiKey = CONFIG.apiKey || process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error('Zhipu API Key not configured');
  }

  const response = await axios.post(
    CONFIG.apiBase || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    {
      model: CONFIG.model || 'glm-4',
      messages: messages || [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: CONFIG.timeout
    }
  );

  return response.data.choices[0].message.content;
}

/**
 * 调用自定义 API（需要配置完整的请求格式）
 */
async function callCustom(prompt, messages) {
  const apiKey = CONFIG.apiKey || process.env.AI_API_KEY;
  const apiUrl = CONFIG.apiBase || process.env.AI_API_BASE;
  
  if (!apiUrl) {
    throw new Error('Custom API URL not configured');
  }

  // 根据你的 API 格式调整请求体
  const response = await axios.post(
    apiUrl,
    {
      // 根据你的 API 文档调整
      prompt: prompt,
      messages: messages,
      model: CONFIG.model
    },
    {
      headers: {
        'Authorization': apiKey ? `Bearer ${apiKey}` : undefined,
        'Content-Type': 'application/json',
        ...(process.env.AI_CUSTOM_HEADERS ? JSON.parse(process.env.AI_CUSTOM_HEADERS) : {})
      },
      timeout: CONFIG.timeout
    }
  );

  // 根据你的 API 响应格式调整
  return response.data.content || response.data.result || response.data.text;
}

/**
 * 主函数
 */
exports.main = async (event, context) => {
  const { action, prompt, messages } = event;
  
  // 检查配置
  const provider = CONFIG.provider || 'openai';
  const apiKey = CONFIG.apiKey || process.env.AI_API_KEY;
  
  if (!apiKey && provider !== 'custom') {
    return { 
      ok: false, 
      error: `API Key not configured for provider: ${provider}. Please set AI_API_KEY environment variable.` 
    };
  }

  try {
    let content = '';
    
    // 根据 provider 调用不同的服务
    switch (provider) {
      case 'openai':
        content = await callOpenAI(prompt, messages);
        break;
      case 'deepseek':
        content = await callDeepSeek(prompt, messages);
        break;
      case 'qwen':
        content = await callQwen(prompt, messages);
        break;
      case 'wenxin':
        content = await callWenxin(prompt, messages);
        break;
      case 'zhipu':
        content = await callZhipu(prompt, messages);
        break;
      case 'custom':
        content = await callCustom(prompt, messages);
        break;
      default:
        return { ok: false, error: `Unsupported provider: ${provider}` };
    }
    
    return {
      ok: true,
      content: content
    };
  } catch (error) {
    console.error('AI API error', error);
    return {
      ok: false,
      error: error.response?.data?.error?.message || error.message || 'AI service error'
    };
  }
};
