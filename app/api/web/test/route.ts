import { NextResponse } from 'next/server';

/**
 * 测试互联网访问功能的简单端点
 */
export async function GET() {
  return NextResponse.json({
    message: '互联网访问功能已启用',
    endpoints: {
      fetch: '/api/web/fetch',
      methods: ['GET', 'POST'],
    },
    examples: [
      {
        description: '获取网页内容',
        url: '/api/web/fetch',
        method: 'POST',
        body: {
          url: 'https://api.github.com/repos/microsoft/vscode',
          method: 'GET',
        },
      },
      {
        description: '获取 JSON API',
        url: '/api/web/fetch',
        method: 'POST',
        body: {
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          method: 'GET',
        },
      },
    ],
  });
}
