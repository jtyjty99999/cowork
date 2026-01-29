---
name: explain-code
description: 用可视化图表和类比解释代码。当用户询问"这段代码怎么工作的"、"解释一下这个函数"时自动触发。
argument-hint: [file-path]
disable-model-invocation: false
user-invocable: true
allowed-tools:
  - read_file
  - search_files
  - list_directory
---

# 代码解释 Skill

当解释代码时，请遵循以下步骤：

## 1. 使用类比
将代码比作日常生活中的事物，让概念更容易理解。

## 2. 绘制图表
使用 ASCII 艺术展示代码的流程、结构或关系：

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  输入   │ ──▶ │  处理   │ ──▶ │  输出   │
└─────────┘     └─────────┘     └─────────┘
```

## 3. 逐步讲解
解释代码执行的每一步：
- 输入是什么
- 中间发生了什么转换
- 最终输出是什么

## 4. 指出陷阱
常见的错误或误解是什么？新手容易在哪里犯错？

## 目标文件
$ARGUMENTS

---

保持解释的对话性。对于复杂概念，使用多个类比来帮助理解。
