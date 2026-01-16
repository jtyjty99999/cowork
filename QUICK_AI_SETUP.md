# ⚡ 快速配置 AI - 3 分钟搞定

## 🎯 最简配置（推荐新手）

### 1️⃣ 复制配置文件

```bash
cp .env.local.example .env.local
```

### 2️⃣ 编辑 `.env.local`

打开文件，找到这两行，修改：

```bash
# 改为 true 启用真实 AI
NEXT_PUBLIC_USE_REAL_AI=true

# 填入你的 API Key
NEXT_PUBLIC_OPENAI_API_KEY=sk-你的密钥
```

### 3️⃣ 重启服务器

```bash
npm run dev
```

✅ **完成！** 现在发送消息就会调用真实 AI 了。

---

## 🔑 如何获取 API Key？

### OpenAI (GPT-4)

1. 访问：https://platform.openai.com/api-keys
2. 注册/登录账号
3. 点击 "Create new secret key"
4. 复制密钥（格式：`sk-proj-xxxxx`）
5. 粘贴到 `.env.local` 文件

**费用**：按使用量计费，GPT-4 约 $0.03/1K tokens

### 国内替代方案（更便宜）

#### 阿里云通义千问（推荐）

1. 访问：https://dashscope.console.aliyun.com/
2. 开通服务
3. 获取 API Key
4. 配置：

```bash
NEXT_PUBLIC_USE_REAL_AI=true
NEXT_PUBLIC_OPENAI_API_KEY=sk-你的通义千问密钥
NEXT_PUBLIC_OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
NEXT_PUBLIC_DEFAULT_MODEL=qwen-turbo
```

**费用**：更便宜，约 ¥0.008/1K tokens

#### 智谱 AI (GLM-4)

1. 访问：https://open.bigmodel.cn/
2. 注册并获取 API Key
3. 配置：

```bash
NEXT_PUBLIC_USE_REAL_AI=true
NEXT_PUBLIC_OPENAI_API_KEY=你的智谱密钥
NEXT_PUBLIC_OPENAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
NEXT_PUBLIC_DEFAULT_MODEL=glm-4
```

---

## 🧪 测试配置

### 方法 1：发送测试消息

1. 打开 http://localhost:3000
2. 输入："你好，请介绍一下自己"
3. 按 Enter 发送
4. 等待 AI 响应

### 方法 2：查看控制台

1. 按 F12 打开浏览器控制台
2. 发送消息
3. 查看是否有错误信息

---

## ❌ 常见错误及解决

### 错误 1：API Key 未配置

```
错误：API Key 未配置，请在 .env.local 中设置
```

**解决**：
1. 确认文件名是 `.env.local`（注意前面的点）
2. 确认 API Key 已填写
3. 重启开发服务器

### 错误 2：401 Unauthorized

```
错误：API 请求失败: Incorrect API key provided
```

**解决**：
1. 检查 API Key 是否正确
2. 确认没有多余的空格
3. 确认 API Key 未过期

### 错误 3：余额不足

```
错误：You exceeded your current quota
```

**解决**：
1. 登录 AI 服务平台
2. 充值账户
3. 或切换到其他 AI 服务

### 错误 4：网络错误

```
错误：Failed to fetch
```

**解决**：
1. 检查网络连接
2. 如果在国内，可能需要代理
3. 或使用国内 AI 服务（通义千问、智谱等）

---

## 🎛️ 切换模型

在 `.env.local` 中修改：

```bash
# GPT-4（最强，较贵）
NEXT_PUBLIC_DEFAULT_MODEL=gpt-4

# GPT-3.5（快速，便宜）
NEXT_PUBLIC_DEFAULT_MODEL=gpt-3.5-turbo

# 通义千问
NEXT_PUBLIC_DEFAULT_MODEL=qwen-turbo

# 智谱 GLM-4
NEXT_PUBLIC_DEFAULT_MODEL=glm-4
```

---

## 💡 省钱技巧

1. **开发测试用模拟 AI**：
   ```bash
   NEXT_PUBLIC_USE_REAL_AI=false
   ```

2. **使用便宜的模型**：
   - GPT-3.5 而不是 GPT-4
   - 国内模型（通义千问、智谱）

3. **限制 token 数量**：
   编辑 `lib/ai-service.ts`：
   ```typescript
   max_tokens: 500  // 减少生成的文本长度
   ```

---

## 📞 需要帮助？

1. **详细文档**：查看 [AI_SETUP.md](./AI_SETUP.md)
2. **代码位置**：
   - AI 服务：`lib/ai-service.ts`
   - 状态管理：`hooks/useCowork.ts`
   - 页面逻辑：`app/page.tsx`

---

## ✅ 配置检查清单

- [ ] 已复制 `.env.local.example` 为 `.env.local`
- [ ] 已填入 API Key
- [ ] 已设置 `NEXT_PUBLIC_USE_REAL_AI=true`
- [ ] 已重启开发服务器
- [ ] 发送测试消息成功
- [ ] 收到 AI 响应

**全部完成？恭喜！🎉 你的 AI 已配置成功！**
