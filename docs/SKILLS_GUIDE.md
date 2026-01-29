# Skills 系统指南

Skills 是 Cowork 的扩展能力系统，允许你创建、管理和共享自定义的 AI 能力。

## 快速开始

### 创建你的第一个 Skill

1. 创建 Skill 目录：
```bash
mkdir -p .cowork/skills/my-skill
```

2. 创建 `SKILL.md` 文件：
```markdown
---
name: my-skill
description: 这是我的第一个 Skill
---

这里是 Skill 的指令内容...
```

3. 使用 Skill：
```
/my-skill
```

## Skill 文件结构

```
.cowork/skills/
├── explain-code/
│   ├── SKILL.md          # 主指令文件 (必需)
│   ├── examples/         # 示例文件
│   │   └── sample.md
│   └── scripts/          # 辅助脚本
│       └── helper.py
├── code-review/
│   └── SKILL.md
└── deploy/
    └── SKILL.md
```

## SKILL.md 格式

每个 Skill 由一个 `SKILL.md` 文件定义，包含 YAML frontmatter 和 Markdown 指令内容。

### 基本示例

```markdown
---
name: explain-code
description: 用可视化图表和类比解释代码
argument-hint: [file-path]
---

解释代码时，请遵循以下步骤：

1. **使用类比**: 将代码比作日常生活中的事物
2. **绘制图表**: 使用 ASCII 艺术展示流程
3. **逐步讲解**: 解释每一步发生了什么

目标文件: $ARGUMENTS
```

### Frontmatter 字段参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `name` | string | 必填 | Skill 名称，用于 `/name` 调用 |
| `description` | string | 必填 | 描述，用于 AI 自动匹配 |
| `argument-hint` | string | - | 参数提示，如 `[file-path]` |
| `disable-model-invocation` | boolean | `false` | `true` = 只能用户手动调用 |
| `user-invocable` | boolean | `true` | `false` = 只能 AI 自动调用 |
| `allowed-tools` | string[] | - | 限制可用工具列表 |
| `context` | string | `main` | `fork` = 在子代理中执行 |
| `agent` | string | `Explore` | 子代理类型 |

## 调用控制

### 用户专属 Skill

某些 Skill 有副作用（如部署、提交），应该只由用户手动调用：

```yaml
---
name: deploy
description: 部署应用到生产环境
disable-model-invocation: true
---
```

使用 `disable-model-invocation: true` 后，AI 不会自动触发此 Skill。

### 背景知识 Skill

某些 Skill 是背景知识，不需要用户手动调用：

```yaml
---
name: api-conventions
description: 本项目的 API 设计规范
user-invocable: false
---
```

使用 `user-invocable: false` 后，此 Skill 不会出现在 `/` 命令列表中。

## 参数传递

### 基本参数

使用 `$ARGUMENTS` 获取完整参数字符串：

```markdown
---
name: fix-issue
description: 修复 GitHub Issue
---

修复 Issue #$ARGUMENTS
```

调用：`/fix-issue 123` → 修复 Issue #123

### 索引参数

使用 `$ARGUMENTS[N]` 或 `$N` 获取特定位置的参数：

```markdown
---
name: migrate-component
description: 迁移组件
---

将 $0 组件从 $1 迁移到 $2
```

调用：`/migrate-component Button React Vue`
→ 将 Button 组件从 React 迁移到 Vue

## 工具限制

限制 Skill 只能使用特定工具：

```yaml
---
name: safe-reader
description: 只读取文件，不做修改
allowed-tools:
  - read_file
  - search_files
  - list_directory
---
```

## 动态上下文注入

使用 `!command` 在 Skill 执行前注入命令输出：

```markdown
---
name: pr-summary
description: 总结 PR 变更
---

## PR 上下文
- PR diff: !`gh pr diff`
- 变更文件: !`gh pr diff --name-only`

请总结这个 PR...
```

命令会在 Skill 执行前运行，输出替换到指令中。

## 子代理执行

使用 `context: fork` 在独立上下文中执行 Skill：

```yaml
---
name: deep-research
description: 深度研究某个主题
context: fork
agent: Explore
---

深入研究 $ARGUMENTS：
1. 查找相关文件
2. 分析代码
3. 总结发现
```

## Skills 存储位置

| 位置 | 说明 | 优先级 |
|------|------|--------|
| `.cowork/skills/` | 项目级 Skills | 最高 |
| `~/.cowork/skills/` | 用户全局 Skills | 中 |
| `<plugin>/skills/` | 插件 Skills | 最低 |

项目级 Skills 会覆盖同名的用户级 Skills。

## 最佳实践

### 1. 清晰的描述

描述应包含触发关键词，帮助 AI 自动匹配：

```yaml
# ✅ 好的描述
description: 用可视化图表和类比解释代码。当用户询问"这段代码怎么工作的"时触发。

# ❌ 不好的描述
description: 解释代码
```

### 2. 明确的指令

指令应该具体、可执行：

```markdown
# ✅ 好的指令
解释代码时，请遵循以下步骤：
1. 使用类比
2. 绘制 ASCII 图表
3. 逐步讲解

# ❌ 不好的指令
解释一下代码
```

### 3. 适当的工具限制

只授予必要的工具权限：

```yaml
# ✅ 只读 Skill
allowed-tools:
  - read_file
  - search_files

# ❌ 不限制（可能造成意外修改）
# (不设置 allowed-tools)
```

### 4. 合理的调用控制

有副作用的操作应该禁止 AI 自动调用：

```yaml
# ✅ 部署操作
disable-model-invocation: true

# ❌ 允许 AI 自动部署
disable-model-invocation: false
```

## 故障排除

### Skill 没有触发

1. 检查描述是否包含用户可能使用的关键词
2. 确认 Skill 出现在可用列表中
3. 尝试直接使用 `/skill-name` 调用

### Skill 触发太频繁

1. 使描述更具体
2. 添加 `disable-model-invocation: true`

### 看不到所有 Skills

1. 检查 Skills 目录路径是否正确
2. 确认 SKILL.md 文件格式正确
3. 刷新 Skills 列表

## 示例 Skills

项目内置了以下示例 Skills：

| Skill | 说明 | 调用方式 |
|-------|------|----------|
| `/explain-code` | 解释代码 | 用户/AI |
| `/code-review` | 代码审查 | 用户/AI |
| `/deploy` | 部署应用 | 仅用户 |
| `/fix-issue` | 修复 Issue | 仅用户 |
| `api-conventions` | API 规范 | 仅 AI |

查看 `.cowork/skills/` 目录了解详细实现。
