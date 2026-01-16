/**
 * 互联网访问服务
 * 提供网页抓取、API 调用等功能
 */

export interface WebRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

export interface WebResponse {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  data?: any;
  contentType?: string;
  duration?: number;
  url?: string;
  error?: string;
  details?: string;
}

export class WebService {
  /**
   * 发起网络请求
   */
  async fetch(request: WebRequest): Promise<WebResponse> {
    try {
      const response = await fetch('/api/web/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '网络请求失败',
        details: error.toString(),
      };
    }
  }

  /**
   * 快速 GET 请求
   */
  async get(url: string, headers?: Record<string, string>): Promise<WebResponse> {
    return this.fetch({ url, method: 'GET', headers });
  }

  /**
   * 快速 POST 请求
   */
  async post(url: string, body?: any, headers?: Record<string, string>): Promise<WebResponse> {
    return this.fetch({ url, method: 'POST', body, headers });
  }

  /**
   * 获取网页内容（HTML）
   */
  async getPageContent(url: string): Promise<{ success: boolean; content?: string; error?: string }> {
    const response = await this.get(url);
    
    if (!response.success) {
      return {
        success: false,
        error: response.error || '获取网页失败',
      };
    }

    return {
      success: true,
      content: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
    };
  }

  /**
   * 获取 JSON API 数据
   */
  async getJSON(url: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const response = await this.get(url, {
      'Accept': 'application/json',
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error || '获取 JSON 数据失败',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * 搜索网页内容（简单文本搜索）
   */
  async searchInPage(url: string, keyword: string): Promise<{
    success: boolean;
    found?: boolean;
    matches?: number;
    snippets?: string[];
    error?: string;
  }> {
    const pageResult = await this.getPageContent(url);

    if (!pageResult.success || !pageResult.content) {
      return {
        success: false,
        error: pageResult.error || '无法获取网页内容',
      };
    }

    const content = pageResult.content.toLowerCase();
    const searchTerm = keyword.toLowerCase();
    const matches = (content.match(new RegExp(searchTerm, 'g')) || []).length;

    // 提取包含关键词的片段
    const snippets: string[] = [];
    const lines = pageResult.content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes(searchTerm)) {
        snippets.push(line.trim().slice(0, 200));
        if (snippets.length >= 5) break;
      }
    }

    return {
      success: true,
      found: matches > 0,
      matches,
      snippets,
    };
  }

  /**
   * 下载文件内容
   */
  async downloadFile(url: string): Promise<{
    success: boolean;
    content?: string;
    contentType?: string;
    size?: number;
    error?: string;
  }> {
    const response = await this.get(url);

    if (!response.success) {
      return {
        success: false,
        error: response.error || '下载文件失败',
      };
    }

    return {
      success: true,
      content: response.data,
      contentType: response.contentType,
      size: typeof response.data === 'string' ? response.data.length : 0,
    };
  }
}

// 导出单例
export const webService = new WebService();
