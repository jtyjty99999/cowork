---
name: api-conventions
description: 本项目的 API 设计规范和模式。编写 API 端点时的背景知识。
user-invocable: false
disable-model-invocation: false
---

# API 设计规范

这是本项目的 API 设计规范，AI 在编写 API 相关代码时应遵循这些约定。

## RESTful 命名规范

### URL 结构
- 使用名词复数形式：`/api/users`、`/api/tasks`
- 使用连字符分隔：`/api/user-profiles`
- 避免动词：❌ `/api/getUsers` ✅ `/api/users`

### HTTP 方法
- `GET` - 获取资源
- `POST` - 创建资源
- `PUT` - 完整更新资源
- `PATCH` - 部分更新资源
- `DELETE` - 删除资源

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 100
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "用户名不能为空",
    "details": [...]
  }
}
```

## 状态码使用

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 成功获取/更新 |
| 201 | Created | 成功创建 |
| 204 | No Content | 成功删除 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 500 | Server Error | 服务器错误 |

## 请求验证

所有 API 端点必须：
1. 验证请求参数类型
2. 验证必填字段
3. 验证数据格式（如邮箱、手机号）
4. 返回清晰的错误信息

## 示例

```typescript
// Next.js API Route 示例
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
```
