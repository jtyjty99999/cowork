# 🤖 AI 大模型对接配置指南

## 📋 目录

1. [快速开始](#快速开始)
2. [支持的 AI 服务](#支持的-ai-服务)
3. [详细配置步骤](#详细配置步骤)
4. [代码位置说明](#代码位置说明)
5. [常见问题](#常见问题)

---

## 🚀 快速开始

### 1. 创建环境变量文件

```bash
# 复制示例文件
cp .env.local.example .env.local
```

### 2. 配置 API Key

编辑 `.env.local` 文件，填入你的 API Key：

```bash
# OpenAI API
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1

# 启用真实 AI
NEXT_PUBLIC_USE_REAL_AI=true

# 默认模型
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4
```

### 3. 重启开发服务器

```bash
npm run dev
```

现在发送消息就会调用真实的 AI API！

---

## 🌐 支持的 AI 服务

### 1. OpenAI (GPT-4, GPT-3.5)

**获取 API Key**: https://platform.openai.com/api-keys

```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4
```

**可用模型**:
- `gpt-4` - 最强大的模型
- `gpt-4-turbo` - 更快的 GPT-4
- `gpt-3.5-turbo` - 经济实惠的选择

### 2. Anthropic Claude

**获取 API Key**: https://console.anthropic.com/

```bash
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxxxx
NEXT_PUBLIC_ANTHROPIC_BASE_URL=https://api.anthropic.com
NEXT_PUBLIC_DEFAULT_MODEL=claude-3-opus-20240229
```

**可用模型**:
- `claude-3-opus-20240229` - 最强大
- `claude-3-sonnet-20240229` - 平衡性能
- `claude-3-haiku-20240307` - 快速响应

### 3. 国内 AI 服务（兼容 OpenAI 格式）

#### 阿里云通义千问

```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-xxxxx
NEXT_PUBLIC_OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
NEXT_PUBLIC_DEFAULT_MODEL=qwen-turbo
```

#### 智谱 AI (GLM)

```bash
NEXT_PUBLIC_OPENAI_API_KEY=xxxxx.xxxxx
NEXT_PUBLIC_OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
NEXT_PUBLIC_DEFAULT_MODEL=glm-4
```

#### 百度文心一言

```bash
NEXT_PUBLIC_OPENAI_API_KEY=xxxxx
NEXT_PUBLIC_OPENAI_BASE_URL=https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop
NEXT_PUBLIC_DEFAULT_MODEL=ernie-bot-4
```

### 4. 本地部署模型（Ollama）

```bash
NEXT_PUBLIC_OPENAI_API_KEY=ollama
NEXT_PUBLIC_OPENAI_BASE_URL=http://localhost:11434/v1
NEXT_PUBLIC_DEFAULT_MODEL=llama2
```

---

## 📝 详细配置步骤

### 步骤 1: 获取 API Key

1. 访问你选择的 AI 服务提供商网站
2. 注册账号并登录
3. 进入 API Keys 或开发者设置页面
4. 创建新的 API Key
5. 复制 API Key（只会显示一次，请妥善保存）

### 步骤 2: 配置环境变量

创建 `.env.local` 文件（项目根目录）：

```bash
# 必需配置
NEXT_PUBLIC_OPENAI_API_KEY=你的API密钥
NEXT_PUBLIC_USE_REAL_AI=true

# 可选配置
NEXT_PUBLIC_OPENAI_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4
```

### 步骤 3: 验证配置

1. 重启开发服务器：`npm run dev`
2. 打开浏览器控制台（F12）
3. 发送一条测试消息
4. 查看是否收到 AI 响应

---

## 🗂️ 代码位置说明

### 核心文件

#### 1. `lib/ai-service.ts` - AI 服务封装

这是 AI 服务的核心文件，包含：
- `AIService` 类 - OpenAI 兼容的 API 调用
- `ClaudeService` 类 - Anthropic Claude 专用
- 流式响应支持
- 错误处理

**主要方法**：
```typescript
// 发送聊天请求
await aiService.chat(messages)

// 流式响应
for await (const chunk of aiService.chatStream(messages)) {
  console.log(chunk)
}

// 切换模型
aiService.setModel('gpt-4')
```

#### 2. `hooks/useCowork.ts` - 状态管理

包含两个 AI 响应函数：
- `simulateAIResponse()` - 模拟 AI 响应（用于测试）
- `getRealAIResponse()` - 真实 AI 响应（调用 API）

**切换方式**：在 `app/page.tsx` 中通过 `useRealAI` 变量控制

#### 3. `app/page.tsx` - 主页面

```typescript
// 控制是否使用真实 AI
const useRealAI = process.env.NEXT_PUBLIC_USE_REAL_AI === 'true';

// 发送消息时选择
if (useRealAI) {
  getRealAIResponse(content);
} else {
  simulateAIResponse(content);
}
```

#### 4. `.env.local` - 环境变量配置

存储敏感信息（API Key），不会提交到 Git。

---

## 🎛️ 高级配置

### 自定义 AI 服务

如果你使用的 AI 服务不在列表中，可以自定义：

```typescript
// lib/ai-service.ts
export class CustomAIService extends AIService {
  constructor() {
    super({
      apiKey: process.env.NEXT_PUBLIC_CUSTOM_API_KEY,
      baseURL: process.env.NEXT_PUBLIC_CUSTOM_BASE_URL,
      model: 'your-model-name',
    });
  }

  // 重写 chat 方法以适配特殊的 API 格式
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    // 自定义实现
  }
}
```

### 添加系统提示词

在 `hooks/useCowork.ts` 的 `getRealAIResponse` 函数中：

```typescript
const aiMessages: AIMessage[] = [
  {
    role: 'system',
    content: '你是一个专业的任务助手，帮助用户完成各种工作任务。',
  },
  ...currentMessages.map(msg => ({
    role: msg.role,
    content: msg.content,
  })),
];
```

### 流式响应（实时显示）

修改 `getRealAIResponse` 使用流式 API：

```typescript
let fullContent = '';
for await (const chunk of aiService.chatStream(aiMessages)) {
  fullContent += chunk;
  // 实时更新消息
  updateMessage(messageId, fullContent);
}
```

---

## ❓ 常见问题

### Q1: API Key 配置后不生效？

**A**: 确保：
1. 文件名是 `.env.local`（注意前面的点）
2. 重启了开发服务器（`npm run dev`）
3. 环境变量名正确（`NEXT_PUBLIC_` 前缀）
4. 设置了 `NEXT_PUBLIC_USE_REAL_AI=true`

### Q2: 提示 "API Key 未配置"？

**A**: 检查：
```bash
# 查看环境变量是否加载
console.log(process.env.NEXT_PUBLIC_OPENAI_API_KEY)
```

如果是 `undefined`，说明环境变量未加载。

### Q3: 请求失败，显示 401 错误？

**A**: API Key 无效或过期，请：
1. 检查 API Key 是否正确复制
2. 确认 API Key 是否有效
3. 检查账户余额是否充足

### Q4: 请求失败，显示 CORS 错误？

**A**: 浏览器直接调用 API 可能遇到跨域问题。解决方案：

**方案 1**: 使用代理（推荐）

创建 `app/api/chat/route.ts`：
```typescript
export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ messages, model: 'gpt-4' }),
  });
  
  return response;
}
```

然后在 `lib/ai-service.ts` 中调用 `/api/chat` 而不是直接调用 OpenAI API。

**方案 2**: 使用服务端 API Key

将 `NEXT_PUBLIC_OPENAI_API_KEY` 改为 `OPENAI_API_KEY`（去掉 `NEXT_PUBLIC_` 前缀），并使用 API 路由。

### Q5: 如何切换回模拟 AI？

**A**: 修改 `.env.local`：
```bash
NEXT_PUBLIC_USE_REAL_AI=false
```

或者直接注释掉这一行。

### Q6: 支持多轮对话吗？

**A**: 是的！代码会自动发送完整的对话历史：
```typescript
const currentMessages = prev.currentTaskId ? prev.messages[prev.currentTaskId] || [] : [];
```

### Q7: 如何限制 token 使用？

**A**: 在 `lib/ai-service.ts` 中修改：
```typescript
body: JSON.stringify({
  model: this.model,
  messages,
  temperature: 0.7,
  max_tokens: 1000, // 限制最大 token 数
}),
```

---

## 🔒 安全建议

1. **永远不要**将 `.env.local` 提交到 Git
2. **永远不要**在前端代码中硬编码 API Key
3. 生产环境建议使用服务端 API 路由
4. 定期轮换 API Key
5. 设置 API 使用限额
6. 监控 API 调用量和费用

---

## 📊 测试清单

- [ ] API Key 已配置
- [ ] 环境变量已加载
- [ ] 开发服务器已重启
- [ ] 发送测试消息成功
- [ ] 收到 AI 响应
- [ ] 多轮对话正常
- [ ] 错误处理正常
- [ ] 进度显示正常

---

## 🎉 完成！

配置完成后，你的 Claude Cowork 应用就可以使用真实的 AI 大模型了！

如有问题，请查看：
- 浏览器控制台的错误信息
- 开发服务器的日志输出
- AI 服务提供商的文档
