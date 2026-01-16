/**
 * AI 服务配置
 * 支持 OpenAI、Anthropic Claude 和其他兼容 OpenAI 格式的 API
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AIService {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config?: {
    apiKey?: string;
    baseURL?: string;
    model?: string;
  }) {
    // 从环境变量或配置中获取
    this.apiKey = config?.apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.baseURL = config?.baseURL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = config?.model || process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'gpt-4';
  }

  /**
   * 发送聊天请求
   * 使用 Next.js API 路由避免 CORS 问题
   */
  async chat(messages: AIMessage[]): Promise<AIResponse> {
    try {
      // 调用本地 API 路由，由服务端转发请求
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model: this.model,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `API 请求失败: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
      };
    } catch (error) {
      console.error('AI 服务调用失败:', error);
      throw error;
    }
  }

  /**
   * 流式响应（可选实现）
   */
  async *chatStream(messages: AIMessage[]): AsyncGenerator<string> {
    if (!this.apiKey) {
      throw new Error('API Key 未配置');
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            console.error('解析流数据失败:', e);
          }
        }
      }
    }
  }

  /**
   * 设置模型
   */
  setModel(model: string) {
    this.model = model;
  }

  /**
   * 获取当前模型
   */
  getModel() {
    return this.model;
  }
}

// 导出单例实例
export const aiService = new AIService();

// 导出用于 Anthropic Claude 的配置
export class ClaudeService extends AIService {
  constructor() {
    super({
      apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      baseURL: process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL,
      model: 'claude-3-opus-20240229',
    });
  }

  async chat(messages: AIMessage[]): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API Key 未配置');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.filter(m => m.role !== 'system'),
          system: messages.find(m => m.role === 'system')?.content,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API 请求失败: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.content[0]?.text || '',
        model: data.model,
        usage: data.usage,
      };
    } catch (error) {
      console.error('Claude 服务调用失败:', error);
      throw error;
    }
  }
}
