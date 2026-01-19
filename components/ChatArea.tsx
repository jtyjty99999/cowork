'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, ChevronDown, Terminal } from 'lucide-react';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import { formatToolResult, generateToolSummary } from '@/lib/tools/result-formatter';
import TaskPlanDisplay from './TaskPlanDisplay';
import QuickTaskCards from './QuickTaskCards';
import { quickTasks } from '@/lib/quick-tasks';

interface ChatAreaProps {
  taskTitle: string;
  messages: Message[];
  onTitleChange: (title: string) => void;
  onSendMessage: (content: string, images?: { url: string; name: string; size: number; base64?: string }[]) => void;
  isAIResponding?: boolean;
}

export default function ChatArea({ taskTitle, messages, onTitleChange, onSendMessage, isAIResponding = false }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [model, setModel] = useState('opus-4.5');
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string; size: number; base64?: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && uploadedImages.length === 0) return;
    
    // 构建消息内容
    let messageContent = input;
    if (uploadedImages.length > 0) {
      const imageContext = uploadedImages.map(img =>
        `[图片: ${img.name}](${img.url})`
      ).join('\n');
      messageContent = uploadedImages.length > 0 && input ? `${input}\n\n${imageContext}` : imageContext;
    }
    
    onSendMessage(messageContent, uploadedImages);
    setInput('');
    setUploadedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 忽略中文输入法的确认事件
    if (e.nativeEvent.isComposing) {
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: { url: string; name: string; size: number; base64?: string }[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          newImages.push({
            url: data.url,
            name: data.name,
            size: data.size,
            base64: data.base64,
          });
        } else {
          const error = await response.json();
          alert(`上传失败: ${error.error}`);
        }
      }

      setUploadedImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col bg-primary h-screen">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <input
          type="text"
          value={taskTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full text-base font-medium text-text-primary outline-none bg-transparent"
          placeholder="Enter task title..."
        />
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6">
        {/* 快速任务模板 - 仅在没有消息时显示 */}
        {messages.length === 0 && (
          <div className="max-w-4xl mx-auto mt-20">
            <QuickTaskCards 
              tasks={quickTasks.slice(0, 6)} 
              onSelectTask={(prompt) => {
                setInput(prompt);
                textareaRef.current?.focus();
              }}
            />
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className="mb-6 animate-fade-in">
            {msg.role === 'user' ? (
              <div className="bg-secondary p-4 rounded-xl max-w-3xl ml-auto">
                <div className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.images && msg.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {msg.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={img.url} 
                          alt={img.name}
                          className="w-full h-auto rounded-lg border border-border"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          {img.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl">
                {msg.content && (
                  <div className="text-[15px] leading-relaxed text-text-primary mb-4 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight, rehypeRaw]}
                      components={{
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="bg-tertiary px-1.5 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        },
                        a: ({ node, children, ...props }: any) => (
                          <a className="text-accent hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
                            {children}
                          </a>
                        ),
                        pre: ({ node, children, ...props }: any) => (
                          <pre className="bg-[#0d1117] p-4 rounded-lg overflow-x-auto my-3" {...props}>
                            {children}
                          </pre>
                        ),
                        blockquote: ({ node, children, ...props }: any) => (
                          <blockquote className="border-l-4 border-accent pl-4 italic my-3" {...props}>
                            {children}
                          </blockquote>
                        ),
                        table: ({ node, children, ...props }: any) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-border" {...props}>
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({ node, children, ...props }: any) => (
                          <th className="border border-border px-3 py-2 bg-secondary" {...props}>
                            {children}
                          </th>
                        ),
                        td: ({ node, children, ...props }: any) => (
                          <td className="border border-border px-3 py-2" {...props}>
                            {children}
                          </td>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                {msg.taskPlan && msg.taskPlan.length > 0 && (
                  <TaskPlanDisplay steps={msg.taskPlan} />
                )}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden mt-4">
                    <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Terminal size={16} />
                        <span>Tool Calls ({msg.toolCalls.length})</span>
                      </div>
                    </div>
                    <div className="p-4 bg-tertiary space-y-3">
                      {msg.toolCalls.map((toolCall, index) => (
                        <div key={index} className="border border-border rounded-lg overflow-hidden bg-primary">
                          <div className="px-3 py-2 bg-secondary border-b border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-accent">
                                  {generateToolSummary(toolCall.tool, toolCall.parameters)}
                                </div>
                                <div className="text-xs text-text-secondary mt-0.5">
                                  {toolCall.tool}
                                </div>
                              </div>
                              {toolCall.result && (
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  toolCall.result.success 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {toolCall.result.success ? '✓ 成功' : '✗ 失败'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="p-3">
                            {toolCall.result && (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code: ({ node, inline, className, children, ...props }: any) => {
                                      return !inline ? (
                                        <code className={`${className} bg-[#2d2d2d] text-[#a9dc76]`} {...props}>
                                          {children}
                                        </code>
                                      ) : (
                                        <code className="bg-gray-100 px-1 py-0.5 rounded text-xs" {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {formatToolResult(toolCall.tool, toolCall.result)}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {msg.command && (
                  <div className="border border-border rounded-lg overflow-hidden mt-4">
                    <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Terminal size={16} />
                        <span>Running command</span>
                      </div>
                      <button className="p-1 hover:bg-tertiary rounded transition-colors">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <div className="p-4 bg-tertiary">
                      <div className="mb-3">
                        <div className="text-xs text-text-secondary mb-1">Request</div>
                        <div className="bg-[#2d2d2d] text-[#a9dc76] p-3 rounded-md font-mono text-[13px] overflow-x-auto">
                          {JSON.stringify(msg.command, null, 2)}
                        </div>
                      </div>
                      {msg.command.description && (
                        <div>
                          <div className="text-xs text-text-secondary mb-1">Description</div>
                          <div className="text-sm text-text-primary">{msg.command.description}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* AI 正在响应的加载提示 */}
        {isAIResponding && (
          <div className="mb-6 animate-fade-in">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm">AI 正在思考中...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        {/* 图片预览区域 */}
        {uploadedImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <img 
                  src={img.url} 
                  alt={img.name}
                  className="h-20 w-20 object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-3 p-3 border border-border rounded-xl bg-primary">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-8 h-8 flex items-center justify-center hover:bg-tertiary rounded-md transition-colors flex-shrink-0 disabled:opacity-50"
            title="上传图片"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus size={20} className="text-text-secondary" />
            )}
          </button>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            className="flex-1 resize-none outline-none text-[15px] leading-relaxed max-h-[200px] bg-transparent"
          />
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="px-3 py-1.5 text-[13px] border border-border rounded-md outline-none cursor-pointer bg-primary"
            >
              <option value="opus-4.5">Opus 4.5</option>
              <option value="sonnet-4">Sonnet 4</option>
              <option value="haiku-4">Haiku 4</option>
            </select>
            
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 bg-accent hover:bg-accent-hover disabled:bg-tertiary disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        
        <div className="text-xs text-text-secondary text-center mt-2">
          Claude is AI and can make mistakes. Please double-check responses.
        </div>
      </div>
    </div>
  );
}
