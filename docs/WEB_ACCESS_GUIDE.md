# 🌐 互联网访问功能指南

## 功能概述

Cowork 现在支持互联网访问功能，可以：
- 📄 获取网页内容
- 🔌 调用公开 API
- 📥 下载文件
- 🔍 搜索网页内容

## API 端点

### `/api/web/fetch`

主要的互联网访问端点，支持 GET 和 POST 请求。

#### 请求格式

```typescript
POST /api/web/fetch
Content-Type: application/json

{
  "url": "https://example.com",
  "method": "GET",  // 可选：GET, POST, PUT, DELETE, PATCH
  "headers": {},    // 可选：自定义请求头
  "body": {}        // 可选：请求体（非 GET 请求）
}
```

#### 响应格式

```typescript
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {},
  "data": "...",           // 响应内容
  "contentType": "text/html",
  "duration": 234,         // 请求耗时（毫秒）
  "url": "https://example.com"
}
```

## 使用示例

### 1. 在代码中使用

```typescript
import { webService } from '@/lib/web-service';

// 简单 GET 请求
const response = await webService.get('https://api.github.com/users/github');

// POST 请求
const postResponse = await webService.post(
  'https://api.example.com/data',
  { key: 'value' }
);

// 获取网页内容
const pageContent = await webService.getPageContent('https://example.com');

// 获取 JSON 数据
const jsonData = await webService.getJSON('https://api.example.com/data');

// 搜索网页内容
const searchResult = await webService.searchInPage(
  'https://example.com',
  'keyword'
);
```

### 2. 在 Hook 中使用

```typescript
const { fetchFromWeb } = useCowork();

// 获取网页内容并显示在聊天中
await fetchFromWeb('https://api.github.com/repos/microsoft/vscode');
```

### 3. 通过 AI 对话使用

直接在聊天中告诉 AI：

```
请帮我获取 https://api.github.com/repos/microsoft/vscode 的信息
```

或者：

```
请访问 https://jsonplaceholder.typicode.com/posts/1 并告诉我内容
```

## 实际应用场景

### 场景 1：获取 GitHub 仓库信息

```typescript
const response = await webService.getJSON(
  'https://api.github.com/repos/microsoft/vscode'
);

if (response.success) {
  console.log('仓库名称:', response.data.name);
  console.log('Star 数:', response.data.stargazers_count);
  console.log('描述:', response.data.description);
}
```

### 场景 2：获取天气信息

```typescript
const weather = await webService.getJSON(
  'https://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=YOUR_KEY'
);
```

### 场景 3：搜索网页内容

```typescript
const result = await webService.searchInPage(
  'https://example.com/blog',
  'JavaScript'
);

console.log('找到匹配:', result.matches);
console.log('内容片段:', result.snippets);
```

### 场景 4：下载文件

```typescript
const file = await webService.downloadFile(
  'https://example.com/document.pdf'
);

if (file.success) {
  console.log('文件大小:', file.size);
  console.log('文件类型:', file.contentType);
}
```

## 安全限制

为了安全考虑，互联网访问功能有以下限制：

1. ✅ **允许的协议**：仅支持 HTTP 和 HTTPS
2. ❌ **禁止的协议**：file://, ftp://, data:// 等
3. 🔒 **请求头**：自动添加 User-Agent
4. ⏱️ **超时**：默认请求超时时间由浏览器控制

## 错误处理

```typescript
const response = await webService.get('https://invalid-url.com');

if (!response.success) {
  console.error('错误:', response.error);
  console.error('详情:', response.details);
}
```

## 测试端点

访问 `/api/web/test` 查看功能状态和示例：

```bash
curl http://localhost:3000/api/web/test
```

## 与 AI 集成

AI 助手已经配置了互联网访问能力，可以：

1. **自动识别**需要访问互联网的请求
2. **智能提取**网页中的关键信息
3. **格式化展示**获取的内容
4. **总结分析**网页数据

### 示例对话

**用户**: 请帮我查看 GitHub 上 Next.js 仓库的最新信息

**AI**: 我来帮你获取 Next.js 仓库的信息...
- 访问 https://api.github.com/repos/vercel/next.js
- 提取关键信息（Star 数、最新版本、描述等）
- 格式化展示结果

## 高级用法

### 自定义请求头

```typescript
const response = await webService.fetch({
  url: 'https://api.example.com/data',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Accept': 'application/json',
  },
});
```

### POST 请求带 Body

```typescript
const response = await webService.fetch({
  url: 'https://api.example.com/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: {
    title: 'New Item',
    content: 'Item content',
  },
});
```

## 性能优化

- ⚡ 请求通过服务端代理，避免 CORS 问题
- 📊 自动记录请求耗时
- 🎯 支持不同内容类型（JSON、文本、二进制）
- 💾 二进制数据自动转换为 base64

## 故障排查

### 问题：请求失败

**检查项**：
1. URL 格式是否正确
2. 目标网站是否可访问
3. 是否需要认证
4. 网络连接是否正常

### 问题：CORS 错误

**解决方案**：
所有请求通过服务端代理，已自动处理 CORS 问题。

### 问题：超时

**解决方案**：
检查目标网站响应速度，考虑使用更快的 API 端点。

## 更新日志

- **v1.0.0** (2026-01-16)
  - ✨ 初始版本
  - 支持 GET/POST 请求
  - 支持多种内容类型
  - 集成到 AI 对话中

## 相关文档

- [README.md](./README.md) - 项目概述
- [AI_SETUP.md](./AI_SETUP.md) - AI 配置指南
- [FILESYSTEM_SANDBOX_GUIDE.md](./FILESYSTEM_SANDBOX_GUIDE.md) - 文件系统指南
