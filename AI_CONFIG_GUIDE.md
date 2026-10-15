# AI API 配置完整指南

## 📋 目录
1. [快速开始](#快速开始)
2. [支持的 AI 服务](#支持的-ai-服务)
3. [配置步骤](#配置步骤)
4. [各服务商详细配置](#各服务商详细配置)
5. [测试验证](#测试验证)
6. [常见问题](#常见问题)

---

## 🚀 快速开始

### 第一步：安装依赖
```powershell
cd cloudfunctions/ai
npm install
```

### 第二步：配置环境变量
在微信开发者工具的云开发控制台中配置环境变量（见下方详细步骤）

### 第三步：部署云函数
右键点击 `cloudfunctions/ai` 文件夹 → 选择「上传并部署：云端安装依赖」

---

## 🤖 支持的 AI 服务

| 服务商 | Provider 值 | 说明 |
|--------|------------|------|
| OpenAI | `openai` | GPT-3.5/GPT-4（需要科学上网或代理） |
| 通义千问 | `qwen` | 阿里云 AI（国内可用） |
| 文心一言 | `wenxin` | 百度 AI（国内可用） |
| 智谱AI | `zhipu` | 智谱清言（国内可用） |
| 自定义 | `custom` | 支持任意兼容 OpenAI 格式的 API |

---

## ⚙️ 配置步骤

### 方式一：环境变量配置（推荐）

#### 1. 打开云开发控制台
1. 在微信开发者工具中，点击顶部「云开发」按钮
2. 进入「云函数」页面
3. 找到 `ai` 云函数，点击进入

#### 2. 配置环境变量
点击「配置」→「环境变量」，添加以下变量：

**基础配置（必填）：**
```
AI_PROVIDER = openai          # 服务提供商
AI_API_KEY = sk-xxxxxxxxxxxx  # API Key
AI_MODEL = gpt-3.5-turbo      # 模型名称（可选）
```

**高级配置（可选）：**
```
AI_API_BASE = https://api.openai.com/v1/chat/completions  # 自定义 API 地址
AI_TIMEOUT = 30000                                          # 超时时间（毫秒）
```

#### 3. 保存并部署
- 点击「保存」
- 右键 `cloudfunctions/ai` → 「上传并部署：云端安装依赖」

---

### 方式二：代码配置（不推荐，仅用于测试）

直接修改 `cloudfunctions/ai/index.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  provider: 'openai',           // 服务提供商
  apiKey: 'sk-xxxxxxxxxxxx',    // 你的 API Key
  model: 'gpt-3.5-turbo',       // 模型名称
  apiBase: '',                  // API 地址（可选）
  timeout: 30000                // 超时时间
};
```

⚠️ **注意**：不要将 API Key 提交到代码仓库！

---

## 📝 各服务商详细配置

### 1. OpenAI（GPT-3.5/GPT-4）

**适用场景**：需要高质量回复，有科学上网或代理

**环境变量：**
```
AI_PROVIDER = openai
AI_API_KEY = sk-xxxxxxxxxxxx
AI_MODEL = gpt-3.5-turbo        # 或 gpt-4
```

**获取 API Key：**
1. 访问 https://platform.openai.com/
2. 注册/登录账号
3. 进入「API Keys」页面
4. 点击「Create new secret key」创建密钥

**如果使用代理：**
```
AI_API_BASE = https://your-proxy.com/v1/chat/completions
```

---

### 2. 通义千问（阿里云）

**适用场景**：国内用户，无需代理，价格相对便宜

**环境变量：**
```
AI_PROVIDER = qwen
AI_API_KEY = sk-xxxxxxxxxxxx
AI_MODEL = qwen-turbo           # 或 qwen-plus, qwen-max
```

**获取 API Key：**
1. 访问 https://dashscope.aliyun.com/
2. 注册/登录阿里云账号
3. 开通「通义千问」服务
4. 在「API-KEY 管理」中创建密钥

**计费说明：**
- qwen-turbo：约 0.008 元/千 tokens
- qwen-plus：约 0.02 元/千 tokens
- qwen-max：约 0.12 元/千 tokens

---

### 3. 文心一言（百度）

**适用场景**：国内用户，百度生态

**环境变量：**
```
AI_PROVIDER = wenxin
AI_API_KEY = your_api_key       # API Key
AI_SECRET_KEY = your_secret_key  # Secret Key（必填）
AI_MODEL = ernie-bot-turbo      # 或 ernie-bot, ernie-bot-4
```

**获取 API Key：**
1. 访问 https://cloud.baidu.com/
2. 注册/登录百度智能云账号
3. 开通「文心一言」服务
4. 在「应用管理」中创建应用，获取 API Key 和 Secret Key

**注意**：文心一言需要同时配置 `AI_API_KEY` 和 `AI_SECRET_KEY`

---

### 4. 智谱AI（GLM）

**适用场景**：国内用户，清华大学团队开发

**环境变量：**
```
AI_PROVIDER = zhipu
AI_API_KEY = xxxxxxxxxxxxxx
AI_MODEL = glm-4                # 或 glm-3-turbo
```

**获取 API Key：**
1. 访问 https://open.bigmodel.cn/
2. 注册/登录账号
3. 进入「API Keys」页面
4. 创建新的 API Key

**计费说明：**
- glm-3-turbo：约 0.005 元/千 tokens
- glm-4：约 0.1 元/千 tokens

---

### 5. 自定义 API

**适用场景**：使用其他兼容 OpenAI 格式的 API 服务

**环境变量：**
```
AI_PROVIDER = custom
AI_API_BASE = https://your-api.com/v1/chat/completions
AI_API_KEY = your_api_key       # 可选
AI_MODEL = your-model-name
```

**如果需要自定义请求头：**
```
AI_CUSTOM_HEADERS = {"X-Custom-Header": "value"}
```

---

## 🧪 测试验证

### 方法一：在小程序中测试

1. 重新编译小程序
2. 进入「写信」页面
3. 点击「AI 生成开头」按钮
4. 如果配置正确，会生成信件开头内容

### 方法二：在云函数控制台测试

1. 进入云开发控制台 → 云函数 → `ai`
2. 点击「测试」按钮
3. 输入测试参数：
```json
{
  "action": "chat",
  "prompt": "你好，请介绍一下自己"
}
```
4. 点击「测试」，查看返回结果

### 方法三：查看日志

1. 进入云开发控制台 → 云函数 → `ai`
2. 点击「日志」查看运行日志
3. 如果有错误，会显示具体错误信息

---

## ❓ 常见问题

### Q1: 提示 "API Key not configured"
**原因**：环境变量未配置或配置错误

**解决**：
1. 检查云开发控制台的环境变量是否正确
2. 确认变量名是 `AI_API_KEY`（区分大小写）
3. 重新部署云函数

---

### Q2: 提示 "AI service error" 或超时
**原因**：网络问题或 API 服务不可用

**解决**：
1. **OpenAI**：检查是否需要代理，或使用国内服务
2. **国内服务**：检查 API Key 是否有效，账户是否有余额
3. 增加超时时间：设置 `AI_TIMEOUT = 60000`

---

### Q3: 返回内容为空或格式错误
**原因**：API 响应格式与预期不符

**解决**：
1. 查看云函数日志，确认 API 返回的原始数据
2. 如果是自定义 API，可能需要调整 `callCustom` 函数中的响应解析逻辑

---

### Q4: 如何切换不同的 AI 服务？
**解决**：
1. 修改环境变量 `AI_PROVIDER` 的值
2. 配置对应的 `AI_API_KEY`
3. 重新部署云函数

---

### Q5: 如何降低 API 调用成本？
**建议**：
1. 使用更便宜的模型（如 qwen-turbo、glm-3-turbo）
2. 限制每次调用的 token 数量
3. 添加缓存机制（相同 prompt 不重复调用）
4. 设置用户调用频率限制

---

### Q6: 支持流式输出吗？
**当前版本**：不支持流式输出，返回完整结果

**未来计划**：可以扩展支持流式输出，提升用户体验

---

## 📚 相关文档

- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [通义千问 API 文档](https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9)
- [文心一言 API 文档](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Ilkkrb0i5)
- [智谱AI API 文档](https://open.bigmodel.cn/dev/api)

---

## 🔒 安全建议

1. ✅ **使用环境变量**：不要将 API Key 硬编码到代码中
2. ✅ **定期更换密钥**：建议每 3 个月更换一次 API Key
3. ✅ **设置调用限制**：在云函数中添加调用频率限制
4. ✅ **监控费用**：定期查看 API 调用费用，设置预算告警
5. ✅ **错误处理**：不要在前端暴露 API Key 或详细错误信息

---

## 💡 最佳实践

1. **开发环境**：使用便宜的模型（如 qwen-turbo）进行测试
2. **生产环境**：根据需求选择合适的模型，平衡质量和成本
3. **错误处理**：在前端添加友好的错误提示
4. **用户体验**：添加加载动画，提示用户 AI 正在生成内容
5. **内容审核**：AI 生成的内容也需要通过内容安全审核

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看云函数日志
2. 检查环境变量配置
3. 参考各服务商的官方文档
4. 在项目 Issues 中提问
