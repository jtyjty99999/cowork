# 🚀 文件系统与沙箱快速开始

## ⚡ 3 分钟上手

### 1️⃣ 启用功能

编辑 `.env.local`：

```bash
# 启用文件系统访问
NEXT_PUBLIC_ENABLE_FILESYSTEM=true

# 启用沙箱命令执行
NEXT_PUBLIC_ENABLE_SANDBOX=true
```

### 2️⃣ 重启服务器

```bash
npm run dev
```

### 3️⃣ 测试功能

在聊天界面输入：

```
列出 workspace 目录的文件
```

或

```
执行命令: ls -la
```

✅ **完成！** 现在 AI 可以访问文件系统了。

---

## 📂 工作区说明

所有文件操作都在 `workspace` 目录内进行：

```
cowork/
└── workspace/          ← 安全的工作区
    ├── README.md
    ├── projects/
    └── data/
```

**安全保证**：
- ✅ 无法访问 workspace 外的文件
- ✅ 无法访问敏感路径（~/.ssh, .env 等）
- ✅ 危险命令自动拦截

---

## 🎯 常用命令示例

### 文件操作

```
读取 README.md 文件
写入文件 test.txt 内容为 "Hello World"
创建目录 projects
搜索所有 .ts 文件
删除 old-file.txt
```

### 命令执行

```
执行命令: pwd
执行命令: ls -la
执行命令: echo "Hello"
执行命令: cat README.md
```

### 危险命令（会被拦截）

```
执行命令: rm -rf /        ❌ 被拦截
执行命令: sudo su         ❌ 被拦截
读取 ~/.ssh/id_rsa        ❌ 被拦截
```

---

## 🔧 自定义工作区

在 `.env.local` 中设置：

```bash
WORKSPACE_ROOT=/path/to/your/custom/workspace
```

---

## 📚 详细文档

查看完整功能说明：[FILESYSTEM_SANDBOX_GUIDE.md](./FILESYSTEM_SANDBOX_GUIDE.md)

---

## ✅ 测试清单

- [ ] 已启用文件系统功能
- [ ] 已启用沙箱功能
- [ ] 已重启服务器
- [ ] 可以列出文件
- [ ] 可以读取文件
- [ ] 可以执行安全命令
- [ ] 危险命令被拦截

**全部完成？恭喜！🎉 文件系统和沙箱功能已就绪！**
