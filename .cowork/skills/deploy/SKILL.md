---
name: deploy
description: 部署应用到生产环境。执行测试、构建和部署流程。
argument-hint: [environment]
disable-model-invocation: true
user-invocable: true
---

# 部署 Skill

将应用部署到指定环境。

**⚠️ 注意**: 此 Skill 只能由用户手动调用，AI 不会自动触发部署。

## 部署流程

### 1. 预检查
- 确认当前分支状态
- 检查是否有未提交的更改
- 验证环境配置

### 2. 运行测试
```bash
npm run test
```

### 3. 构建应用
```bash
npm run build
```

### 4. 部署
根据目标环境执行部署：
- **staging**: 部署到测试环境
- **production**: 部署到生产环境

### 5. 验证
- 检查部署状态
- 运行冒烟测试
- 确认服务正常运行

## 目标环境
$ARGUMENTS

## 回滚计划
如果部署失败，执行以下回滚步骤：
1. 停止当前部署
2. 恢复到上一个稳定版本
3. 通知相关人员
