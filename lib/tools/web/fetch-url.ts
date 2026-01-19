/**
 * 网络请求工具
 */

import { webService } from '@/lib/web-service';
import { ToolDefinition } from '../types';

export const fetchUrlTool: ToolDefinition = {
  name: 'fetch_url',
  description: 'Fetch content from a URL (supports GET, POST, etc.)',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'URL to fetch',
      required: true,
    },
    {
      name: 'method',
      type: 'string',
      description: 'HTTP method (GET, POST, PUT, DELETE, etc.)',
      required: false,
    },
    {
      name: 'headers',
      type: 'object',
      description: 'HTTP headers',
      required: false,
    },
    {
      name: 'body',
      type: 'any',
      description: 'Request body (for POST, PUT, etc.)',
      required: false,
    },
  ],
  examples: [
    {
      description: 'Simple GET request',
      code: `\`\`\`tool:fetch_url
{
  "url": "https://api.github.com/repos/microsoft/vscode",
  "method": "GET"
}
\`\`\``,
    },
    {
      description: 'POST request with body',
      code: `\`\`\`tool:fetch_url
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "key": "value"
  }
}
\`\`\``,
    },
  ],
  execute: async (parameters) => {
    const webResponse = await webService.fetch({
      url: parameters.url,
      method: parameters.method || 'GET',
      headers: parameters.headers,
      body: parameters.body,
    });
    
    // webService.fetch 返回 { success, status, data, ... }
    // 我们需要返回 { success, result } 格式，其中 result 包含完整的响应
    if (!webResponse.success) {
      return { success: false, error: webResponse.error || '请求失败' };
    }
    
    // 验证响应数据格式
    let actualData = webResponse.data;
    
    // 解包嵌套结构
    while (actualData && typeof actualData === 'object' && actualData.success && actualData.data && actualData.status) {
      actualData = actualData.data;
    }
    
    // 检查数据是否有效
    if (!actualData || (typeof actualData === 'object' && Object.keys(actualData).length === 0)) {
      return { 
        success: false, 
        error: '响应数据格式异常：数据为空或格式无效' 
      };
    }
    
    return { 
      success: true, 
      result: webResponse  // 完整的响应对象
    };
  },
  formatResult: (result: any) => {
    if (!result.success) {
      return `❌ 请求失败: ${result.error}`;
    }
    
    // 尝试多种可能的数据路径
    let webResponse = result.result || result.data || result;
    
    // 解包嵌套结构：如果有 success 和 data 字段，说明这是包装层
    while (webResponse.success && webResponse.data && webResponse.status) {
      // 这是 webService 的响应包装，继续解包
      webResponse = webResponse.data;
    }
    
    // 现在 webResponse 应该是实际的 API 响应数据（如 {chart: {...}}）
    // 检查是否存在
    if (!webResponse || typeof webResponse !== 'object') {
      return `⚠️ 响应数据格式异常`;
    }
    
    // 获取状态信息（如果还在包装层）
    const statusInfo = result.result || result.data;
    const statusEmoji = statusInfo?.status >= 200 && statusInfo?.status < 300 ? '✅' : '⚠️';
    const status = statusInfo?.status || 'N/A';
    const duration = statusInfo?.duration || 0;
    const contentType = statusInfo?.contentType || 'unknown';
    
    // webResponse 就是实际的 API 响应数据
    const responseData = typeof webResponse === 'string' 
      ? webResponse 
      : JSON.stringify(webResponse, null, 2);
    
    return `${statusEmoji} **请求成功** (HTTP ${status})

⏱️ 耗时: ${duration}ms
📦 类型: ${contentType}

📄 **响应数据**:
\`\`\`json
${responseData.slice(0, 2000)}${responseData.length > 2000 ? '\n...(数据过长，已截断)' : ''}
\`\`\``;
  },
  generateSummary: (parameters) => {
    return `请求: ${parameters.url}`;
  },
};
