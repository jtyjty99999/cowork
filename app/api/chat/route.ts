import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    // 从环境变量获取配置（服务端环境变量，不需要 NEXT_PUBLIC_ 前缀）
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const defaultModel = process.env.DEFAULT_MODEL || process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'gpt-4';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key 未配置，请在 .env.local 中设置 OPENAI_API_KEY 或 NEXT_PUBLIC_OPENAI_API_KEY' },
        { status: 500 }
      );
    }

    console.log('🚀 发送 AI 请求:', {
      baseURL,
      model: model || defaultModel,
      messageCount: messages.length,
    });

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ AI API 错误:', error);
      return NextResponse.json(
        { error: error.error?.message || `API 请求失败: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('✅ 收到 AI 响应:', {
      model: data.model,
      usage: data.usage,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ 服务器错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
