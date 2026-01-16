'use client';

import { useState, useEffect } from 'react';
import { FileText, Book, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface DocItem {
  name: string;
  path: string;
  category: string;
  description: string;
}

const docs: DocItem[] = [
  // 入门级
  { name: '快速开始', path: 'START.md', category: '入门级', description: '5 分钟快速上手' },
  { name: '快速 AI 配置', path: 'QUICK_AI_SETUP.md', category: '入门级', description: '3 分钟配置真实 AI' },
  { name: '文件系统快速入门', path: 'FILESYSTEM_QUICKSTART.md', category: '入门级', description: '文件操作基础' },
  
  // 进阶级
  { name: 'AI 详细设置', path: 'AI_SETUP.md', category: '进阶级', description: '完整的 AI 配置指南' },
  { name: '文件系统沙箱指南', path: 'FILESYSTEM_SANDBOX_GUIDE.md', category: '进阶级', description: '完整的文件系统功能' },
  { name: '互联网访问指南', path: 'WEB_ACCESS_GUIDE.md', category: '进阶级', description: '网络请求和 API 调用' },
  { name: '任务模板系统', path: 'TASK_TEMPLATES.md', category: '进阶级', description: '自定义任务模板' },
  
  // 参考级
  { name: 'AI 配置总结', path: 'AI_CONFIG_SUMMARY.md', category: '参考级', description: '配置位置一览' },
  { name: 'AI 集成指南', path: 'AI_INTEGRATION_GUIDE.md', category: '参考级', description: '深入的集成说明' },
  { name: '文档索引', path: 'INDEX.md', category: '参考级', description: '所有文档的完整索引' },
  
  // 维护级
  { name: 'CORS 修复', path: 'CORS_FIX.md', category: '维护级', description: 'CORS 问题解决方案' },
  { name: '工作区上下文修复', path: 'WORKSPACE_CONTEXT_FIX.md', category: '维护级', description: '上下文相关问题' },
  { name: '常见问题修复', path: 'FIXES.md', category: '维护级', description: '其他常见问题' },
  { name: '测试指南', path: 'TEST_GUIDE.md', category: '维护级', description: '测试和调试' },
];

const categories = ['入门级', '进阶级', '参考级', '维护级'];

export default function DocsPage() {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDoc) {
      loadDocument(selectedDoc);
    }
  }, [selectedDoc]);

  const loadDocument = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/docs/read?path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
      } else {
        setContent('# 文档加载失败\n\n无法加载该文档，请检查文件是否存在。');
      }
    } catch (error) {
      setContent('# 错误\n\n加载文档时发生错误。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Book className="text-orange-500" size={24} />
            <h1 className="text-xl font-bold">项目文档</h1>
          </div>
          <p className="text-sm text-gray-600">Cowork 完整文档中心</p>
        </div>

        <div className="p-4">
          <Link 
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg mb-4 transition-colors"
          >
            <Home size={16} />
            返回主页
          </Link>

          {categories.map(category => {
            const categoryDocs = docs.filter(doc => doc.category === category);
            return (
              <div key={category} className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                  {category}
                </h3>
                <div className="space-y-1">
                  {categoryDocs.map(doc => (
                    <button
                      key={doc.path}
                      onClick={() => setSelectedDoc(doc.path)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedDoc === doc.path
                          ? 'bg-orange-50 text-orange-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{doc.name}</div>
                          <div className="text-xs text-gray-500 truncate">{doc.description}</div>
                        </div>
                        {selectedDoc === doc.path && <ChevronRight size={16} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {selectedDoc ? (
          <div className="max-w-4xl mx-auto p-8">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    a: ({ node, children, ...props }: any) => (
                      <a className="text-orange-600 hover:underline" {...props}>
                        {children}
                      </a>
                    ),
                    code: ({ node, inline, className, children, ...props }: any) => {
                      return !inline ? (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Book size={64} className="mb-4 text-gray-300" />
            <h2 className="text-2xl font-semibold mb-2">选择一个文档开始阅读</h2>
            <p className="text-sm">从左侧列表中选择你想查看的文档</p>
          </div>
        )}
      </div>
    </div>
  );
}
