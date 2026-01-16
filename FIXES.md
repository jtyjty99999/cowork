# 问题修复说明

## ✅ 已修复：聊天触发两次的问题

### 问题原因

1. **React StrictMode 双重渲染**：在开发环境下，React 18 的 StrictMode 会故意双重调用组件和 effects 来帮助发现副作用问题
2. **useEffect 重复执行**：没有使用 `useRef` 来防止初始化代码在 StrictMode 下运行两次
3. **useCallback 依赖问题**：`simulateAIResponse` 的依赖项导致函数频繁重新创建

### 修复方案

#### 1. 添加 useRef 防止重复初始化

```typescript
// app/page.tsx
const initialized = useRef(false);

useEffect(() => {
  // Prevent double initialization in React StrictMode
  if (initialized.current) return;
  initialized.current = true;
  
  // 初始化代码...
}, []);
```

#### 2. 优化 useCallback 依赖

```typescript
// hooks/useCowork.ts
const simulateAIResponse = useCallback((userMessage: string) => {
  // ... 实现代码
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // 移除所有依赖，使用函数式更新
```

### 验证修复

重启开发服务器后，现在：
- ✅ 初始化只会运行一次
- ✅ 发送消息只会触发一次 AI 响应
- ✅ 不会出现重复的消息

### 关于 React StrictMode

React StrictMode 在开发环境下的双重渲染是**有意为之**的行为，用于：
- 检测意外的副作用
- 检测过时的 API 使用
- 检测不安全的生命周期方法

在生产构建中（`npm run build`），StrictMode 不会导致双重渲染。

如果你想在开发环境中也禁用 StrictMode，可以修改 `next.config.js`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // 改为 false
}

module.exports = nextConfig
```

**不推荐**禁用 StrictMode，因为它能帮助发现潜在问题。我们的修复方案已经确保代码在 StrictMode 下也能正常工作。

## 测试步骤

1. 重启开发服务器：`npm run dev`
2. 打开浏览器控制台
3. 发送一条消息
4. 确认只有一条用户消息和一条 AI 响应

## 其他优化

- 所有状态更新函数（`addMessage`、`addArtifact` 等）都使用函数式更新，避免闭包问题
- 使用 `useRef` 来存储初始化状态，确保幂等性
- 添加了适当的 ESLint 注释来处理必要的规则禁用
