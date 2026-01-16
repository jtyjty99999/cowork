# 🛠️ AI 工具调用系统

## 概述

AI 工具调用系统允许 AI 助手实际执行文件操作、网络请求等任务，而不仅仅是"说"要做什么。

## 工作原理

### 1. AI 使用特定格式调用工具

当你要求 AI 执行操作时，AI 会在回复中包含工具调用代码块：

```tool:write_file
{
  "path": "hello.txt",
  "content": "Hello World"
}
```

### 2. 系统自动解析并执行

前端会自动：
1. 解析 AI 响应中的工具调用
2. 执行对应的操作
3. 显示执行结果

### 3. 结果反馈

执行成功或失败的结果会显示在聊天中。

## 可用工具

### 📁 文件系统工具

#### 1. write_file - 写入文件
创建或覆盖文件内容。

**示例对话**：
```
用户: 请帮我创建一个 notes.md 文件，内容是我的笔记
AI: 我来帮你创建文件。

​```tool:write_file
{
  "path": "notes.md",
  "content": "# My Notes\n\n这是我的笔记内容。"
}
​```

文件已创建成功！
```

#### 2. read_file - 读取文件
读取文件的内容。

**示例对话**：
```
用户: 读取 notes.md 的内容
AI: 我来读取文件。

​```tool:read_file
{
  "path": "notes.md"
}
​```
```

#### 3. list_directory - 列出目录
查看目录中的文件和文件夹。

**示例**：
```tool:list_directory
{
  "path": "."
}
```

#### 4. create_directory - 创建目录
创建新的文件夹。

**示例**：
```tool:create_directory
{
  "path": "my_folder"
}
```

#### 5. delete_file - 删除文件
删除文件或目录。

**示例**：
```tool:delete_file
{
  "path": "old_file.txt"
}
```

#### 6. search_files - 搜索文件
按模式搜索文件。

**示例**：
```tool:search_files
{
  "pattern": "*.md",
  "directory": "."
}
```

### 🌐 网络访问工具

#### 7. fetch_url - 获取网页内容
从互联网获取数据。

**示例**：
```tool:fetch_url
{
  "url": "https://api.github.com/repos/microsoft/vscode",
  "method": "GET"
}
```

## 实际使用示例

### 场景 1: 创建项目文件

**用户**: 请帮我创建一个 README.md 文件，包含项目标题和描述

**AI 回复**:
```
好的，我来为你创建 README 文件。

​```tool:write_file
{
  "path": "README.md",
  "content": "# My Project\n\n这是一个很棒的项目。\n\n## 功能\n\n- 功能 1\n- 功能 2"
}
​```

README 文件已创建完成！
```

**系统执行**: 
- ✅ 工具执行成功: `write_file`
- 文件 `workspace/README.md` 已创建

### 场景 2: 读取并修改文件

**用户**: 读取 notes.md 并在末尾添加一条新笔记

**AI 回复**:
```
我先读取文件内容。

​```tool:read_file
{
  "path": "notes.md"
}
​```

现在我添加新内容。

​```tool:write_file
{
  "path": "notes.md",
  "content": "# My Notes\n\n原有内容...\n\n## 新笔记\n\n这是新添加的内容。"
}
​```

已成功添加新笔记！
```

### 场景 3: 组织文件

**用户**: 创建一个 docs 文件夹，并把所有 .md 文件移动进去

**AI 回复**:
```
我来帮你组织文件。

首先创建 docs 文件夹：

​```tool:create_directory
{
  "path": "docs"
}
​```

然后搜索所有 Markdown 文件：

​```tool:search_files
{
  "pattern": "*.md",
  "directory": "."
}
​```

（AI 会根据搜索结果继续移动文件）
```

### 场景 4: 获取网络数据并保存

**用户**: 从 GitHub API 获取 VS Code 仓库信息并保存到文件

**AI 回复**:
```
我来获取 VS Code 仓库信息。

​```tool:fetch_url
{
  "url": "https://api.github.com/repos/microsoft/vscode",
  "method": "GET"
}
​```

现在保存到文件：

​```tool:write_file
{
  "path": "vscode-info.json",
  "content": "{\n  \"name\": \"vscode\",\n  \"stars\": 150000,\n  ...\n}"
}
​```

信息已保存到 vscode-info.json！
```

## 技术细节

### 工具调用格式

```
​```tool:tool_name
{
  "parameter1": "value1",
  "parameter2": "value2"
}
​```
```

- **tool_name**: 工具的名称（如 `write_file`）
- **parameters**: JSON 格式的参数对象

### 解析逻辑

系统使用正则表达式解析工具调用：
```typescript
/```tool:(\w+)\n([\s\S]*?)```/g
```

### 执行流程

1. AI 生成包含工具调用的响应
2. `parseToolCalls()` 解析工具调用
3. `executeToolCalls()` 执行每个工具
4. 结果显示在聊天界面

### 安全限制

- ✅ 所有文件操作限制在 `workspace/` 目录
- ✅ 路径验证防止目录遍历攻击
- ✅ 网络请求仅支持 HTTP/HTTPS
- ✅ 工具执行结果会显示给用户

## 故障排查

### 问题：AI 不使用工具调用

**原因**: 
- AI 没有理解需要使用工具
- 系统提示词未正确传递

**解决方案**:
1. 明确告诉 AI "请创建文件" 而不是 "能创建文件吗"
2. 检查 `NEXT_PUBLIC_USE_REAL_AI=true` 是否设置
3. 重启开发服务器

### 问题：工具执行失败

**检查项**:
1. 文件路径是否正确
2. 是否有写入权限
3. 查看浏览器控制台的错误信息

### 问题：文件没有实际保存

**原因**: 可能是：
- 工具调用格式不正确
- API 路由出错
- 权限问题

**解决方案**:
1. 检查 `workspace/` 目录是否存在
2. 查看浏览器控制台和服务器日志
3. 手动测试 API: `POST /api/filesystem/write`

## 最佳实践

### 1. 明确的指令
❌ "能帮我处理一下文件吗"
✅ "请创建一个 todo.txt 文件，内容是我的待办事项"

### 2. 提供完整信息
❌ "保存这个"
✅ "把这段代码保存到 script.js 文件中"

### 3. 逐步操作
对于复杂任务，让 AI 分步执行：
1. 先列出文件
2. 读取需要的文件
3. 修改内容
4. 保存回去

### 4. 验证结果
操作完成后，可以要求 AI：
- "列出当前目录的文件"
- "读取刚才创建的文件确认内容"

## 相关文件

- `@/lib/ai-tools.ts:1-202` - 工具系统实现
- `@/lib/filesystem-service.ts:1-175` - 文件系统服务
- `@/hooks/useCowork.ts:1-520` - 工具调用集成
- `@/app/api/filesystem/` - 文件系统 API 路由

## 更新日志

- **v1.0.0** (2026-01-16)
  - ✨ 初始版本
  - 支持 7 种工具
  - 自动解析和执行
  - 结果反馈显示
