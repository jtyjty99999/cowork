# 图片视觉识别功能实现文档

## 📋 功能概述

实现了完整的图片上传和 AI 视觉识别功能，支持用户上传图片并让 AI 模型真正"看到"并分析图片内容。

## 🎯 解决的问题

### 问题 1：AI 误解图片内容
**现象**：上传流程图后，AI 误认为是股票/期货价格走势图

**根本原因**：
1. 图片只传递了文件名，没有实际的视觉数据
2. 代码中存在多处股票相关的提示词污染 AI 上下文

### 问题 2：图片上下文不完整
**现象**：图片附在上下文中只有文件名，AI 无法理解图片内容

**根本原因**：
- 图片只保存了 URL 和元数据，没有转换为 base64 传递给模型
- AI 消息格式不支持多模态内容（文本 + 图片）

## ✅ 实现方案

### 1. 清理股票相关污染源

#### 1.1 `lib/task-planner.ts`
**修改前**：
```typescript
/**
 * 格式示例：
 * ```plan
 * 1. 查询英伟达股票数据 [fetch_url]
 * 2. 分析股票走势数据
 * 3. 生成分析报告 [write_file]
 * ```
 */

**Example 1 - Stock Query:**
User: "查询某只股票最近一周的股价并生成报告"
1. 查询股票数据 [fetch_url]
2. 分析股票走势和关键指标
```

**修改后**：
```typescript
/**
 * 格式示例：
 * ```plan
 * 1. 获取数据 [fetch_url]
 * 2. 分析数据内容
 * 3. 生成分析报告 [write_file]
 * ```
 */

**Example 1 - Data Analysis:**
User: "查询某个 API 的数据并生成报告"
1. 获取 API 数据 [fetch_url]
2. 分析数据内容和关键信息
```

#### 1.2 `lib/quick-tasks.ts`
**修改前**：
```typescript
{
  id: 'stock-analysis',
  title: '股票数据分析',
  prompt: '请帮我查询英伟达（NVDA）最近一周的股票数据，分析走势，并生成一份详细的分析报告...',
}
```

**修改后**：
```typescript
{
  id: 'api-data-analysis',
  title: 'API 数据分析',
  prompt: '请帮我查询 https://api.github.com/repos/microsoft/vscode 的仓库数据，分析关键信息...',
}
```

#### 1.3 `hooks/useCowork.ts`
**修改前**：
```typescript
- For stock data APIs, use Unix timestamps or proper date formats based on today's date
```

**修改后**：
```typescript
- For time-sensitive queries, use proper date formats based on today's date
```

### 2. 实现图片 Base64 传递

#### 2.1 图片上传 API (`app/api/upload/image/route.ts`)

**新增功能**：
```typescript
// 保存文件
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);
await writeFile(filepath, buffer);

// 转换为 base64
const base64 = buffer.toString('base64');
const mimeType = file.type;
const base64Data = `data:${mimeType};base64,${base64}`;

// 返回文件 URL 和 base64 数据
return NextResponse.json({
  success: true,
  url,
  name: file.name,
  size: file.size,
  type: file.type,
  base64: base64Data, // 新增
});
```

#### 2.2 类型定义更新 (`types/index.ts`)

**Message 接口**：
```typescript
export interface Message {
  // ...
  images?: {
    url: string;
    name: string;
    size: number;
    base64?: string; // 新增
  }[];
}
```

**AIMessage 接口** (`lib/ai-service.ts`)：
```typescript
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}
```

#### 2.3 前端组件更新 (`components/ChatArea.tsx`)

**保存 base64 数据**：
```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...
  if (response.ok) {
    const data = await response.json();
    newImages.push({
      url: data.url,
      name: data.name,
      size: data.size,
      base64: data.base64, // 保存 base64
    });
  }
};
```

#### 2.4 AI 上下文构建 (`hooks/useCowork.ts`)

**多模态消息格式**：
```typescript
const formatMessageContentWithImages = (msg: Message): AIMessage['content'] => {
  if (!msg.images || msg.images.length === 0) return msg.content;
  
  // 如果有图片且有 base64 数据，使用多模态格式
  const hasBase64 = msg.images.some(img => img.base64);
  if (hasBase64) {
    const contentParts: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }> = [];
    
    // 添加文本内容
    if (msg.content) {
      contentParts.push({ type: 'text', text: msg.content });
    }
    
    // 添加图片
    msg.images.forEach(img => {
      if (img.base64) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: img.base64 }
        });
      }
    });
    
    return contentParts;
  }
  
  // 降级：如果没有 base64，只返回文本描述
  const imageLines = msg.images
    .map(img => `- ${img.name} (${img.url}, ${(img.size / 1024).toFixed(1)}KB)`)
    .join('\n');
  return `${msg.content}\n\n[Uploaded images]\n${imageLines}`;
};
```

**当前用户消息构建**：
```typescript
let currentUserMessage: AIMessage['content'] = userMessage;
if (images && images.length > 0 && images.some(img => img.base64)) {
  const contentParts: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }> = [];
  
  if (userMessage) {
    contentParts.push({ type: 'text', text: userMessage });
  }
  
  images.forEach(img => {
    if (img.base64) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: img.base64 }
      });
    }
  });
  
  currentUserMessage = contentParts;
}
```

## 📊 数据流程

```
用户上传图片
    ↓
前端发送到 /api/upload/image
    ↓
服务端保存文件 + 转换为 base64
    ↓
返回 { url, name, size, base64: "data:image/png;base64,..." }
    ↓
ChatArea 保存完整数据（包括 base64）
    ↓
用户发送消息
    ↓
useCowork 构建多模态消息
    ↓
{
  role: 'user',
  content: [
    { type: 'text', text: '用户输入的文字' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
  ]
}
    ↓
/api/chat 转发到 AI 模型（OpenAI/Claude 等）
    ↓
模型接收图片 base64 并进行视觉分析
    ↓
返回分析结果
```

## 🎨 支持的功能

### 1. 图片上传
- ✅ 支持 JPEG、PNG、GIF、WebP 格式
- ✅ 文件大小限制 10MB
- ✅ 自动生成唯一文件名（时间戳）
- ✅ 保存到 `public/uploads/` 目录
- ✅ 转换为 base64 编码

### 2. 图片预览
- ✅ 上传后即时预览
- ✅ 显示文件名和大小
- ✅ 支持删除已上传图片

### 3. 多模态 AI 分析
- ✅ 图片以 base64 格式传递给模型
- ✅ 支持文本 + 多张图片组合
- ✅ 历史消息中的图片也会传递
- ✅ 降级处理：无 base64 时仅传递文本描述

### 4. 上下文清理
- ✅ 移除所有股票相关示例和提示词
- ✅ 改用中性的 API 数据分析示例
- ✅ 避免特定领域偏见

## ⚙️ 技术细节

### Base64 编码
```typescript
const buffer = Buffer.from(await file.arrayBuffer());
const base64 = buffer.toString('base64');
const base64Data = `data:${file.type};base64,${base64}`;
```

### 多模态消息格式（OpenAI Vision API）
```typescript
{
  role: 'user',
  content: [
    { type: 'text', text: '请分析这张图片' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KG...' } }
  ]
}
```

### 降级策略
如果图片没有 base64 数据（例如历史数据迁移），系统会自动降级为文本描述：
```
用户输入的文字

[Uploaded images]
- flowchart.png (/uploads/1234567890.png, 156.2KB)
```

## 🧪 测试验证

### 测试场景 1：流程图识别
1. 上传一张流程图
2. 输入："请帮我分析这张流程图"
3. ✅ AI 正确识别为流程图，不会误认为股票走势图
4. ✅ AI 能够描述流程图的结构和内容

### 测试场景 2：多图片上传
1. 上传多张图片
2. 输入："对比这几张图片的差异"
3. ✅ AI 能够同时分析多张图片
4. ✅ 所有图片的 base64 都正确传递

### 测试场景 3：历史消息
1. 发送带图片的消息
2. 继续对话
3. ✅ 历史消息中的图片在后续对话中仍然可用
4. ✅ AI 可以引用之前的图片内容

## ⚠️ 注意事项

### 1. 模型要求
需要使用支持 Vision 的模型：
- OpenAI: `gpt-4-vision-preview`, `gpt-4o`, `gpt-4o-mini`
- Anthropic: `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`
- 其他兼容 OpenAI Vision API 格式的模型

### 2. 性能考虑
- Base64 编码会增加约 33% 的数据量
- 建议单张图片不超过 5MB
- 大量图片会增加 API 调用成本和响应时间

### 3. API 兼容性
当前实现基于 OpenAI Vision API 格式，如果使用其他 AI 服务商，可能需要调整消息格式。

### 4. 存储管理
- 图片保存在 `public/uploads/` 目录
- 建议定期清理旧图片
- 可以考虑添加图片过期清理机制

## 📝 相关文件

### 修改的文件
- `app/api/upload/image/route.ts` - 图片上传 API，添加 base64 转换
- `types/index.ts` - 添加 base64 字段到 Message 类型
- `lib/ai-service.ts` - 更新 AIMessage 支持多模态格式
- `components/ChatArea.tsx` - 保存和传递 base64 数据
- `app/page.tsx` - 更新类型定义
- `hooks/useCowork.ts` - 构建多模态消息，清理股票提示词
- `lib/task-planner.ts` - 移除股票示例
- `lib/quick-tasks.ts` - 替换股票任务为通用 API 分析

### 未修改的文件
- `app/api/chat/route.ts` - 无需修改，直接转发多模态消息
- 其他工具和服务文件 - 保持不变

## 🚀 后续优化建议

1. **图片压缩**：上传前自动压缩大图片
2. **缓存优化**：对相同图片使用缓存避免重复传输
3. **CDN 支持**：将图片上传到 CDN 减少服务器负载
4. **批量上传**：优化多图片上传的用户体验
5. **图片管理**：添加图片库功能，方便复用历史图片
6. **OCR 增强**：对于包含大量文字的图片，可以先 OCR 提取文字
7. **格式转换**：自动将不支持的格式转换为支持的格式

## 📚 参考资料

- [OpenAI Vision API 文档](https://platform.openai.com/docs/guides/vision)
- [Anthropic Claude Vision 文档](https://docs.anthropic.com/claude/docs/vision)
- [Base64 编码说明](https://developer.mozilla.org/en-US/docs/Glossary/Base64)
