/**
 * Skills 列表组件
 * 显示可用的 Skills，支持搜索和调用
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Search, 
  ChevronRight, 
  Lock, 
  Bot,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { SkillDefinition } from '@/lib/skills';

interface SkillsListProps {
  skills: SkillDefinition[];
  isLoading: boolean;
  error: string | null;
  onSkillSelect: (skill: SkillDefinition) => void;
  onRefresh: () => void;
}

export function SkillsList({
  skills,
  isLoading,
  error,
  onSkillSelect,
  onRefresh,
}: SkillsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('project');

  // 按来源分组
  const groupedSkills = useMemo(() => {
    const groups: Record<string, SkillDefinition[]> = {
      project: [],
      user: [],
      plugin: [],
    };

    const filtered = skills.filter(skill => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query)
      );
    });

    for (const skill of filtered) {
      groups[skill.source].push(skill);
    }

    return groups;
  }, [skills, searchQuery]);

  const categoryLabels: Record<string, string> = {
    project: '项目 Skills',
    user: '用户 Skills',
    plugin: '插件 Skills',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    project: <Zap className="w-4 h-4" />,
    user: <Bot className="w-4 h-4" />,
    plugin: <Zap className="w-4 h-4" />,
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">加载 Skills 失败</span>
        </div>
        <p className="text-xs text-gray-500 mb-2">{error}</p>
        <button
          onClick={onRefresh}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 搜索框 */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜索 Skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Skills 列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
            <span className="ml-2 text-sm text-gray-500">加载中...</span>
          </div>
        ) : skills.length === 0 ? (
          <div className="p-4 text-center">
            <Zap className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂无可用 Skills</p>
            <p className="text-xs text-gray-600 mt-1">
              在 .cowork/skills/ 目录创建 SKILL.md 文件
            </p>
          </div>
        ) : (
          <div className="py-2">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => {
              if (categorySkills.length === 0) return null;

              const isExpanded = expandedCategory === category;

              return (
                <div key={category} className="mb-1">
                  {/* 分类标题 */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-800"
                  >
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                    {categoryIcons[category]}
                    <span>{categoryLabels[category]}</span>
                    <span className="ml-auto text-gray-600">
                      {categorySkills.length}
                    </span>
                  </button>

                  {/* Skill 项目 */}
                  {isExpanded && (
                    <div className="ml-4">
                      {categorySkills.map((skill) => (
                        <SkillItem
                          key={skill.id}
                          skill={skill}
                          onClick={() => onSkillSelect(skill)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 底部刷新按钮 */}
      <div className="p-2 border-t border-gray-700">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          刷新 Skills
        </button>
      </div>
    </div>
  );
}

interface SkillItemProps {
  skill: SkillDefinition;
  onClick: () => void;
}

function SkillItem({ skill, onClick }: SkillItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-800 rounded-md group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-400">
            /{skill.name}
          </span>
          {skill.argumentHint && (
            <span className="text-xs text-gray-500">{skill.argumentHint}</span>
          )}
          {skill.disableModelInvocation && (
            <span title="仅用户可调用">
              <Lock className="w-3 h-3 text-yellow-500" />
            </span>
          )}
          {!skill.userInvocable && (
            <span title="仅 AI 可调用">
              <Bot className="w-3 h-3 text-purple-500" />
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {skill.description}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 mt-0.5" />
    </button>
  );
}

export default SkillsList;
