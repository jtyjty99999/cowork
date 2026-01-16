# 🎯 AI 集成完整指南

## 📊 配置流程图

```
开始
  ↓
复制 .env.local.example → .env.local
  ↓
选择 AI 服务提供商
  ├─ OpenAI (GPT-4)
  ├─ Anthropic (Claude)
  ├─ 阿里云通义千问
  ├─ 智谱 AI (GLM)
  └─ 其他
  ↓
获取 API Key
  ↓
填入 .env.local
  ├─ NEXT_PUBLIC_OPENAI_API_KEY
  ├─ NEXT_PUBLIC_USE_REAL_AI=true
  └─ NEXT_PUBLIC_DEFAULT_MODEL
  ↓
重启开发服务器 (npm run dev)
  ↓
测试发送消息
  ↓
成功？
  ├─ 是 → 完成 ✅
  └─ 否 → 查看错误信息 → 调试
```

---

## 🔧 核心代码解析

### 1. AI 服务类 (`lib/ai-service.ts`)

```typescript
export class AIService {
  // 构造函数：初始化配置
  constructor(config?: {
    apiKey?: string;      // API 密钥
    baseURL?: string;     // API 基础 URL
    model?: string;       // 模型名称
  })

  // 核心方法：发送聊天请求
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    // 1. 检查 API Key
    // 2. 构建请求
    // 3. 调用 API
    // 4. 处理响应
    // 5. 返回结果
  }

  // 流式响应（可选）
  async *chatStream(messages: AIMessage[]): AsyncGenerator<string> {
    // 逐字返回 AI 响应
  }
}
```

**使用示例**：
```typescript
import { aiService } from '@/lib/ai-service';

// 发送请求
const response = await aiService.chat([
  { role: 'user', content: '你好' }
]);

console.log(response.content); // AI 的回复
```

---

### 2. 状态管理 Hook (`hooks/useCowork.ts`)

```typescript
export const useCowork = () => {
  // 状态
  const [state, setState] = useState<AppState>(initialState);

  // 真实 AI 响应
  const getRealAIResponse = useCallback(async (userMessage: string) => {
    // 1. 更新进度状态
    updateProgress([...]);

    // 2. 获取对话历史
    const currentMessages = state.messages[state.currentTaskId];

    // 3. 转换消息格式
    const aiMessages = currentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // 4. 调用 AI 服务
    const response = await aiService.chat(aiMessages);

    // 5. 添加响应到消息列表
    addMessage({
      role: 'assistant',
      content: response.content,
    });

    // 6. 更新进度为完成
    updateProgress([...]);
  }, []);

  return {
    state,
    getRealAIResponse,
    // ... 其他方法
  };
};
```

---

### 3. 页面集成 (`app/page.tsx`)

```typescript
export default function Home() {
  const { getRealAIResponse, simulateAIResponse } = useCowork();

  // 控制开关
  const useRealAI = process.env.NEXT_PUBLIC_USE_REAL_AI === 'true';

  // 发送消息
  const handleSendMessage = (content: string) => {
    addMessage({ role: 'user', content });
    
    // 根据配置选择
    if (useRealAI) {
      getRealAIResponse(content);  // 真实 AI
    } else {
      simulateAIResponse(content); // 模拟 AI
    }
  };

  return (
    <ChatArea onSendMessage={handleSendMessage} />
  );
}
```

---

## 🎨 自定义示例

### 示例 1：添加角色设定

在 `hooks/useCowork.ts` 中修改 `getRealAIResponse`：

```typescript
const getRealAIResponse = useCallback(async (userMessage: string) => {
  // ... 前面的代码

  const aiMessages: AIMessage[] = [
    // 添加系统角色
    {
      role: 'system',
      content: `你是一个专业的项目管理助手。
你的职责是：
1. 帮助用户整理和管理文件
2. 提供项目规划建议
3. 协助完成各种工作任务

请用简洁、专业的语言回答。`,
    },
    // 用户的对话历史
    ...currentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // ... 后面的代码
}, []);
```

---

### 示例 2：添加特殊命令处理

```typescript
const getRealAIResponse = useCallback(async (userMessage: string) => {
  // 检查特殊命令
  if (userMessage.startsWith('/')) {
    const command = userMessage.slice(1).toLowerCase();
    
    switch (command) {
      case 'help':
        addMessage({
          role: 'assistant',
          content: '可用命令：\n/help - 显示帮助\n/clear - 清空对话\n/model - 查看当前模型',
        });
        return;
      
      case 'clear':
        // 清空当前任务的消息
        setState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [prev.currentTaskId!]: [],
          },
        }));
        return;
      
      case 'model':
        addMessage({
          role: 'assistant',
          content: `当前模型：${aiService.getModel()}`,
        });
        return;
    }
  }

  // 正常的 AI 请求
  // ... 原有代码
}, []);
```

---

### 示例 3：添加上下文增强

```typescript
const getRealAIResponse = useCallback(async (userMessage: string) => {
  // 获取当前任务信息
  const currentTask = state.tasks.find(t => t.id === state.currentTaskId);
  const workingFiles = state.workingFiles[state.currentTaskId] || [];
  
  // 构建增强的上下文
  const contextInfo = `
当前任务：${currentTask?.title}
工作文件：${workingFiles.map(f => f.filename).join(', ')}
`;

  const aiMessages: AIMessage[] = [
    {
      role: 'system',
      content: `你是一个任务助手。当前上下文信息：\n${contextInfo}`,
    },
    ...currentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // ... 调用 AI
}, []);
```

---

### 示例 4：添加流式响应

修改 `lib/ai-service.ts` 和 `hooks/useCowork.ts`：

```typescript
// hooks/useCowork.ts
const getRealAIResponseStream = useCallback(async (userMessage: string) => {
  // 创建一个临时消息
  const tempMessageId = generateId();
  addMessage({
    id: tempMessageId,
    role: 'assistant',
    content: '',
  });

  let fullContent = '';
  
  try {
    // 使用流式 API
    for await (const chunk of aiService.chatStream(aiMessages)) {
      fullContent += chunk;
      
      // 实时更新消息内容
      setState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [prev.currentTaskId!]: prev.messages[prev.currentTaskId!].map(msg =>
            msg.id === tempMessageId
              ? { ...msg, content: fullContent }
              : msg
          ),
        },
      }));
    }
  } catch (error) {
    console.error('流式响应失败:', error);
  }
}, []);
```

---

## 🔐 安全最佳实践

### 1. 使用服务端 API 路由（推荐）

创建 `app/api/chat/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    
    // 在服务端调用 AI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // 服务端环境变量
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'AI 请求失败' },
      { status: 500 }
    );
  }
}
```

然后修改 `lib/ai-service.ts`：

```typescript
async chat(messages: AIMessage[]): Promise<AIResponse> {
  // 调用自己的 API 路由而不是直接调用 OpenAI
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model,
    usage: data.usage,
  };
}
```

**优点**：
- ✅ API Key 不暴露在前端
- ✅ 避免 CORS 问题
- ✅ 可以添加服务端验证和限流
- ✅ 更安全

---

### 2. 添加请求限流

创建 `lib/rate-limiter.ts`：

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private timeWindow: number;

  constructor(maxRequests = 10, timeWindow = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
}

export const rateLimiter = new RateLimiter(10, 60000); // 每分钟最多 10 次
```

在 `hooks/useCowork.ts` 中使用：

```typescript
import { rateLimiter } from '@/lib/rate-limiter';

const getRealAIResponse = useCallback(async (userMessage: string) => {
  if (!rateLimiter.canMakeRequest()) {
    addMessage({
      role: 'assistant',
      content: '请求过于频繁，请稍后再试。',
    });
    return;
  }

  // ... 正常的 AI 请求
}, []);
```

---

## 📊 监控和日志

### 添加使用统计

```typescript
// lib/usage-tracker.ts
class UsageTracker {
  private totalRequests = 0;
  private totalTokens = 0;

  track(usage: { prompt_tokens: number; completion_tokens: number }) {
    this.totalRequests++;
    this.totalTokens += usage.prompt_tokens + usage.completion_tokens;
    
    console.log('📊 使用统计:', {
      请求次数: this.totalRequests,
      总Token数: this.totalTokens,
      估算费用: `$${(this.totalTokens / 1000 * 0.03).toFixed(4)}`,
    });
  }

  getStats() {
    return {
      requests: this.totalRequests,
      tokens: this.totalTokens,
    };
  }
}

export const usageTracker = new UsageTracker();
```

在 `hooks/useCowork.ts` 中使用：

```typescript
import { usageTracker } from '@/lib/usage-tracker';

const response = await aiService.chat(aiMessages);

// 记录使用情况
if (response.usage) {
  usageTracker.track(response.usage);
}
```

---

## 🎓 学习资源

- **OpenAI 文档**: https://platform.openai.com/docs
- **Anthropic 文档**: https://docs.anthropic.com
- **Next.js 文档**: https://nextjs.org/docs
- **TypeScript 文档**: https://www.typescriptlang.org/docs

---

## ✅ 集成检查清单

- [ ] 已创建 `.env.local` 文件
- [ ] 已配置 API Key
- [ ] 已设置 `NEXT_PUBLIC_USE_REAL_AI=true`
- [ ] 已重启开发服务器
- [ ] 测试发送消息成功
- [ ] 收到真实 AI 响应
- [ ] 多轮对话正常
- [ ] 错误处理正常
- [ ] 已添加使用限制（可选）
- [ ] 已实现服务端代理（推荐）

---

**完成所有步骤？恭喜！🎉 你已成功集成 AI 大模型！**
