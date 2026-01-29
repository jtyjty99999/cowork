---
name: fix-issue
description: 修复 GitHub Issue。读取 Issue 描述，理解需求，实现修复，编写测试。
argument-hint: [issue-number]
disable-model-invocation: true
user-invocable: true
allowed-tools:
  - read_file
  - write_file
  - search_files
  - list_directory
  - fetch_url
---

# 修复 Issue Skill

按照项目编码规范修复指定的 GitHub Issue。

## 修复流程

### 1. 读取 Issue 描述
获取 Issue #$ARGUMENTS 的详细信息：
- 问题描述
- 复现步骤
- 期望行为
- 相关截图或日志

### 2. 理解需求
- 分析问题的根本原因
- 确定影响范围
- 制定修复方案

### 3. 实现修复
- 定位相关代码
- 实现最小化修复
- 确保不引入新问题

### 4. 编写测试
- 添加单元测试覆盖修复的代码
- 添加回归测试防止问题复发
- 确保所有现有测试通过

### 5. 创建提交
```
fix: 修复 #$ARGUMENTS 描述的问题

- 问题原因：[简述]
- 修复方案：[简述]
- 测试覆盖：[是/否]

Closes #$ARGUMENTS
```

## 目标 Issue
#$ARGUMENTS

## 注意事项
- 遵循项目的代码风格
- 保持修改范围最小化
- 确保向后兼容
