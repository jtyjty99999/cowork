# 快速启动指南

## 🤖 想对接真实 AI？

**3 分钟快速配置** → [QUICK_AI_SETUP.md](./QUICK_AI_SETUP.md)

**详细配置指南** → [AI_SETUP.md](./AI_SETUP.md)

**配置位置总结** → [AI_CONFIG_SUMMARY.md](./AI_CONFIG_SUMMARY.md)

---

## 🚀 启动开发服务器

```bash
npm run dev
```

然后在浏览器中访问: http://localhost:3000

## 📦 安装依赖（首次运行）

```bash
npm install
```

## 🏗️ 构建生产版本

```bash
npm run build
npm start
```

## 🎯 主要功能

1. **创建任务**: 点击左侧 "+ New task" 按钮
2. **发送消息**: 在底部输入框输入消息，按 Enter 发送
3. **查看进度**: 右侧面板显示任务进度
4. **查看文件**: Artifacts 和 Working files 区域显示相关文件

## 🔧 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lucide React Icons

## 📝 测试关键词

尝试输入以下关键词查看不同的 AI 响应：

- "find my drafts" - 文件搜索功能
- "organize files" - 文件整理功能
- "create artifact" - 创建文件功能

## 🎨 自定义

- **样式**: 编辑 `tailwind.config.ts`
- **组件**: 修改 `components/` 目录下的文件
- **AI 响应**: 编辑 `hooks/useCowork.ts` 中的 `simulateAIResponse` 函数

## ✅ 最近修复

### 聊天触发两次问题（已修复）

**问题**：发送消息时会收到两次相同的 AI 响应

**修复**：
- 使用 `useRef` 防止初始化重复执行
- 优化 `useCallback` 依赖项
- 确保在 React StrictMode 下正常工作

详细信息请查看 `FIXES.md`

## 📚 相关文档

- `README.md` - 项目概述和完整文档
- `FIXES.md` - 问题修复详细说明
- `TEST_GUIDE.md` - 测试指南
- `CHANGELOG.md` - 版本更新日志

## 🆘 常见问题

**Q: 为什么开发环境下组件会渲染两次？**
A: 这是 React StrictMode 的正常行为，用于检测副作用。我们已经确保副作用只执行一次。

**Q: 如何禁用 StrictMode？**
A: 修改 `next.config.js`，将 `reactStrictMode` 设为 `false`（不推荐）

**Q: 生产环境会有双重渲染吗？**
A: 不会，StrictMode 只在开发环境生效。

## 🔗 快速链接

- 开发服务器: http://localhost:3000
- Next.js 文档: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs
