# 🔧 CORS 问题修复说明

## ❌ 问题描述

在浏览器中直接调用 AI API（如 OpenAI、Claude）时，会遇到 CORS（跨域资源共享）错误：

```
Access to fetch at 'https://api.openai.com/v1/chat/completions' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## ✅ 解决方案

使用 **Next.js API 路由**作为代理，在服务端调用 AI API，避免浏览器的 CORS 限制。

### 架构变化

**修复前**（直接调用，会遇到 CORS）：
```
浏览器 → OpenAI API ❌ CORS 错误
```

**修复后**（通过服务端代理）：
```
浏览器 → Next.js API 路由 → OpenAI API ✅ 成功
```

---

## 📝 修改内容

### 1. 创建 API 路由 (`app/api/chat/route.ts`)

新增服务端 API 路由，负责转发请求到 AI 服务：

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages, model } = await req.json();
  
  // 从服务端环境变量获取 API Key
  const apiKey = process.env.OPENAI_API_KEY;
  
  // 调用 OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, model }),
  });
  
  return NextResponse.json(await response.json());
}
```

### 2. 修改 AI 服务 (`lib/ai-service.ts`)

将直接调用外部 API 改为调用本地 API 路由：

**修改前**：
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${this.apiKey}`,
  },
  // ...
});
```

**修改后**：
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ messages, model: this.model }),
});
```

### 3. 更新环境变量配置

**推荐使用服务端环境变量**（不需要 `NEXT_PUBLIC_` 前缀）：

```bash
# .env.local

# 服务端变量（更安全，不会暴露在浏览器）
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
DEFAULT_MODEL=gpt-4

# 控制开关（需要 NEXT_PUBLIC_ 前缀）
NEXT_PUBLIC_USE_REAL_AI=true
```

---

## 🔒 安全优势

使用服务端 API 路由的好处：

1. ✅ **避免 CORS 问题** - 服务端请求不受浏览器 CORS 限制
2. ✅ **API Key 安全** - API Key 只存在于服务端，不会暴露在浏览器
3. ✅ **请求控制** - 可以在服务端添加限流、验证等逻辑
4. ✅ **统一错误处理** - 服务端统一处理和转换错误信息

---

## 📊 数据流程

```
用户输入消息
    ↓
浏览器 (ChatArea.tsx)
    ↓
hooks/useCowork.ts (getRealAIResponse)
    ↓
lib/ai-service.ts (aiService.chat)
    ↓
fetch('/api/chat') ← 本地请求，无 CORS 问题
    ↓
app/api/chat/route.ts (服务端)
    ↓
fetch('https://api.openai.com/v1/chat/completions')
    ↓
OpenAI API
    ↓
返回响应
    ↓
浏览器显示结果
```

---

## 🧪 测试验证

### 1. 检查 API 路由是否创建

```bash
ls -la app/api/chat/route.ts
```

应该看到文件存在。

### 2. 配置环境变量

编辑 `.env.local`：

```bash
OPENAI_API_KEY=sk-your-real-api-key
NEXT_PUBLIC_USE_REAL_AI=true
```

### 3. 重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
npm run dev
```

### 4. 发送测试消息

1. 打开浏览器 http://localhost:3000
2. 打开开发者工具（F12）→ Network 标签
3. 发送一条消息
4. 查看网络请求：
   - ✅ 应该看到请求 `/api/chat` (本地)
   - ✅ 不应该看到直接请求 `api.openai.com`
   - ✅ 状态码应该是 200

### 5. 查看服务端日志

在终端中应该看到：

```
🚀 发送 AI 请求: { baseURL: '...', model: 'gpt-4', messageCount: 2 }
✅ 收到 AI 响应: { model: 'gpt-4', usage: { ... } }
```

---

## ❓ 常见问题

### Q1: 还是遇到 CORS 错误？

**A**: 检查是否正确修改了 `lib/ai-service.ts`，确保调用的是 `/api/chat` 而不是外部 URL。

### Q2: API 路由返回 500 错误？

**A**: 检查：
1. `.env.local` 中的 `OPENAI_API_KEY` 是否正确
2. 服务器是否重启（环境变量修改后需要重启）
3. 查看服务端日志的错误信息

### Q3: 如何查看详细的错误信息？

**A**: 
1. 浏览器控制台 → Console 标签
2. 服务端终端输出
3. Network 标签 → 点击 `/api/chat` 请求 → Response

### Q4: 可以同时支持多个 AI 服务吗？

**A**: 可以！创建不同的 API 路由：
- `/api/chat/openai`
- `/api/chat/claude`
- `/api/chat/qwen`

### Q5: 生产环境需要额外配置吗？

**A**: 需要在部署平台（如 Vercel、Netlify）设置环境变量：
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `DEFAULT_MODEL`

---

## 🎯 验证清单

- [ ] 已创建 `app/api/chat/route.ts`
- [ ] 已修改 `lib/ai-service.ts` 使用 `/api/chat`
- [ ] 已配置服务端环境变量（`OPENAI_API_KEY`）
- [ ] 已重启开发服务器
- [ ] 发送消息不再出现 CORS 错误
- [ ] 可以正常收到 AI 响应
- [ ] 浏览器 Network 中看到 `/api/chat` 请求

---

## 📚 相关文档

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [环境变量配置](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [CORS 详解](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**修复完成！** 现在可以正常调用 AI API 了 🎉
