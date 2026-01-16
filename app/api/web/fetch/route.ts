import { NextRequest, NextResponse } from 'next/server';

/**
 * 互联网访问 API
 * 支持 GET 和 POST 请求，可以访问任意 URL
 */
export async function POST(request: NextRequest) {
  try {
    const { url, method = 'GET', headers = {}, body } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL 参数是必需的' },
        { status: 400 }
      );
    }

    // 验证 URL 格式
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return NextResponse.json(
        { error: '无效的 URL 格式' },
        { status: 400 }
      );
    }

    // 安全检查：只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return NextResponse.json(
        { error: '只支持 HTTP 和 HTTPS 协议' },
        { status: 400 }
      );
    }

    // 构建请求选项
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'Cowork-Bot/1.0',
        ...headers,
      },
    };

    // 如果有 body 且不是 GET 请求，添加 body
    if (body && method.toUpperCase() !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['Content-Type']) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Content-Type': 'application/json',
        };
      }
    }

    // 发起请求
    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    // 获取响应内容
    const contentType = response.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/')) {
      data = await response.text();
    } else {
      // 对于二进制数据，返回 base64
      const buffer = await response.arrayBuffer();
      data = Buffer.from(buffer).toString('base64');
    }

    // 返回响应
    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      contentType,
      duration,
      url: response.url,
    });

  } catch (error: any) {
    console.error('网络请求失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '网络请求失败',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

// 支持 GET 方法查询
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL 参数是必需的' },
      { status: 400 }
    );
  }

  // 转发到 POST 处理
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ url, method: 'GET' }),
    })
  );
}
