'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, ChevronDown, Terminal } from 'lucide-react';
import { Message } from '@/types';

interface ChatAreaProps {
  taskTitle: string;
  messages: Message[];
  onTitleChange: (title: string) => void;
  onSendMessage: (content: string) => void;
}

export default function ChatArea({ taskTitle, messages, onTitleChange, onSendMessage }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const [model, setModel] = useState('opus-4.5');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        {messages.map((msg) => (
          <div key={msg.id} className="mb-6 animate-fade-in">
            {msg.role === 'user' ? (
              <div className="bg-secondary p-4 rounded-xl max-w-3xl ml-auto">
                <div className="text-[15px] leading-relaxed text-text-primary whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl">
                {msg.content && (
                  <div className="text-[15px] leading-relaxed text-text-primary mb-4 whitespace-pre-wrap">
                    {msg.content}
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
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-3 p-3 border border-border rounded-xl bg-primary">
          <button className="w-8 h-8 flex items-center justify-center hover:bg-tertiary rounded-md transition-colors flex-shrink-0">
            <Plus size={20} className="text-text-secondary" />
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
