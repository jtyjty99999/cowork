# 🤖 AI 配置总结

## 📍 配置位置一览

### 1. 环境变量配置
**文件**: `.env.local` (需要自己创建)
**模板**: `.env.local.example`
**作用**: 存储 API Key 等敏感信息

```bash
# 最小配置
NEXT_PUBLIC_USE_REAL_AI=true
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
```

---

### 2. AI 服务核心代码
**文件**: `lib/ai-service.ts`
**作用**: 封装 AI API 调用逻辑

**主要类**:
- `AIService` - OpenAI 兼容的通用服务
- `ClaudeService` - Anthropic Claude 专用服务

**主要方法**:
```typescript
// 发送聊天请求
await aiService.chat(messages)

// 流式响应
for await (const chunk of aiService.chatStream(messages)) {
  // 处理每个文本片段
}

// 切换模型
aiService.setModel('gpt-4')
```

---

### 3. 状态管理 Hook
**文件**: `hooks/useCowork.ts`
**作用**: 管理应用状态和 AI 交互

**关键函数**:
- `simulateAIResponse()` - 模拟 AI 响应（用于测试）
- `getRealAIResponse()` - 真实 AI 响应（调用 API）

**修改位置**（如需自定义）:
```typescript
// 第 253 行开始
const getRealAIResponse = useCallback(async (userMessage: string) => {
  // 在这里可以添加自定义逻辑
  // 例如：添加系统提示词、处理特殊命令等
});
```

---

### 4. 页面逻辑
**文件**: `app/page.tsx`
**作用**: 控制使用真实 AI 还是模拟 AI

**切换逻辑** (第 21 行):
```typescript
const useRealAI = process.env.NEXT_PUBLIC_USE_REAL_AI === 'true';
```

**发送消息处理** (第 70 行):
```typescript
const handleSendMessage = (content: string) => {
  addMessage({ role: 'user', content });
  
  if (useRealAI) {
    getRealAIResponse(content);  // 真实 AI
  } else {
    simulateAIResponse(content); // 模拟 AI
  }
};
```

---

## 🔄 数据流程图

```
用户输入消息
    ↓
app/page.tsx (handleSendMessage)
    ↓
判断 useRealAI
    ↓
├─ true → hooks/useCowork.ts (getRealAIResponse)
│           ↓
│       lib/ai-service.ts (aiService.chat)
│           ↓
│       调用真实 AI API
│           ↓
│       返回响应
│
└─ false → hooks/useCowork.ts (simulateAIResponse)
            ↓
        返回模拟响应
```

---

## 🛠️ 自定义配置点

### 1. 添加系统提示词

**位置**: `hooks/useCowork.ts` 第 265 行

```typescript
const aiMessages: AIMessage[] = [
  {
    role: 'system',
    content: '你是一个专业的任务助手，精通项目管理和文件整理。',
  },
  ...currentMessages.map(msg => ({
    role: msg.role,
    content: msg.content,
  })),
];
```

### 2. 修改 AI 参数

**位置**: `lib/ai-service.ts` 第 37 行

```typescript
body: JSON.stringify({
  model: this.model,
  messages,
  temperature: 0.7,      // 创造性 (0-2)
  max_tokens: 2000,      // 最大生成长度
  top_p: 1,              // 采样参数
  frequency_penalty: 0,  // 重复惩罚
  presence_penalty: 0,   // 话题新颖度
}),
```

### 3. 添加错误重试

**位置**: `lib/ai-service.ts` 第 28 行

```typescript
async chat(messages: AIMessage[], retries = 3): Promise<AIResponse> {
  try {
    // API 调用代码
  } catch (error) {
    if (retries > 0) {
      console.log(`重试中... 剩余次数: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.chat(messages, retries - 1);
    }
    throw error;
  }
}
```

### 4. 添加请求日志

**位置**: `lib/ai-service.ts` 第 30 行

```typescript
console.log('发送请求:', {
  model: this.model,
  messageCount: messages.length,
  lastMessage: messages[messages.length - 1]?.content.slice(0, 50),
});

const response = await fetch(/* ... */);

console.log('收到响应:', {
  status: response.status,
  model: data.model,
  tokens: data.usage,
});
```

---

## 📂 文件结构

```
cowork/
├── .env.local              # 你的配置（需创建）
├── .env.local.example      # 配置模板
├── lib/
│   └── ai-service.ts       # AI 服务封装 ⭐
├── hooks/
│   └── useCowork.ts        # 状态管理 + AI 调用 ⭐
├── app/
│   └── page.tsx            # 主页面逻辑 ⭐
├── AI_SETUP.md             # 详细配置指南
├── QUICK_AI_SETUP.md       # 快速配置指南
└── AI_CONFIG_SUMMARY.md    # 本文件
```

⭐ = 核心文件

---

## 🎯 快速定位

### 想要...

| 需求 | 文件位置 | 行号 |
|------|---------|------|
| 配置 API Key | `.env.local` | - |
| 修改 AI 参数 | `lib/ai-service.ts` | 37 |
| 添加系统提示词 | `hooks/useCowork.ts` | 265 |
| 切换真实/模拟 AI | `app/page.tsx` | 21 |
| 处理 AI 响应 | `hooks/useCowork.ts` | 273 |
| 错误处理 | `hooks/useCowork.ts` | 286 |
| 支持新的 AI 服务 | `lib/ai-service.ts` | 新建类 |

---

## 🔍 调试技巧

### 1. 查看环境变量

在浏览器控制台输入：
```javascript
console.log({
  useRealAI: process.env.NEXT_PUBLIC_USE_REAL_AI,
  hasApiKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
  model: process.env.NEXT_PUBLIC_DEFAULT_MODEL,
});
```

### 2. 监控 API 调用

在 `lib/ai-service.ts` 的 `chat` 方法开始添加：
```typescript
console.log('🚀 发送 AI 请求:', { model: this.model, messages });
```

在返回前添加：
```typescript
console.log('✅ 收到 AI 响应:', { content: data.choices[0]?.message?.content });
```

### 3. 查看完整错误

在 `hooks/useCowork.ts` 的 catch 块中：
```typescript
console.error('完整错误信息:', {
  error,
  message: error.message,
  stack: error.stack,
});
```

---

## 📚 相关文档

- **快速开始**: [QUICK_AI_SETUP.md](./QUICK_AI_SETUP.md) - 3 分钟配置
- **详细指南**: [AI_SETUP.md](./AI_SETUP.md) - 完整配置说明
- **项目文档**: [README.md](./README.md) - 项目概述
- **更新日志**: [CHANGELOG.md](./CHANGELOG.md) - 版本历史

---

## ✅ 配置完成后

你可以：
1. ✅ 发送消息获得真实 AI 响应
2. ✅ 进行多轮对话
3. ✅ 切换不同的 AI 模型
4. ✅ 自定义 AI 行为
5. ✅ 监控 API 使用情况

---

**需要帮助？** 查看详细文档或在浏览器控制台查看错误信息。
