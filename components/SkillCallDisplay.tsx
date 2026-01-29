/**
 * Skill 调用展示组件
 * 显示 Skill 调用的状态和详情
 */

'use client';

import React from 'react';
import { Zap, CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';

interface SkillCallDisplayProps {
  skillCall: {
    skillName: string;
    arguments: string[];
    status: 'pending' | 'executing' | 'completed' | 'failed';
    description?: string;
    allowedTools?: string[];
  };
}

export default function SkillCallDisplay({ skillCall }: SkillCallDisplayProps) {
  const getStatusIcon = () => {
    switch (skillCall.status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'executing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Zap className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (skillCall.status) {
      case 'pending':
        return '准备中...';
      case 'executing':
        return '执行中...';
      case 'completed':
        return '已完成';
      case 'failed':
        return '执行失败';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (skillCall.status) {
      case 'pending':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'executing':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'failed':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-border';
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden mt-4 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium">Skill 调用</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs text-text-secondary">{getStatusText()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Skill 名称和参数 */}
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-accent/20 text-accent rounded text-sm font-mono">
            /{skillCall.skillName}
          </code>
          {skillCall.arguments.length > 0 && (
            <span className="text-sm text-text-secondary">
              {skillCall.arguments.join(' ')}
            </span>
          )}
        </div>

        {/* 描述 */}
        {skillCall.description && (
          <p className="text-sm text-text-secondary">
            {skillCall.description}
          </p>
        )}

        {/* 工具限制 */}
        {skillCall.allowedTools && skillCall.allowedTools.length > 0 && (
          <div className="flex items-start gap-2 pt-2 border-t border-border/50">
            <Shield className="w-4 h-4 text-text-secondary mt-0.5" />
            <div>
              <span className="text-xs text-text-secondary">允许的工具: </span>
              <span className="text-xs text-text-primary">
                {skillCall.allowedTools.join(', ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
