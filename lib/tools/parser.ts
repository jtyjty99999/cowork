/**
 * 工具调用解析器
 * 从 AI 响应中解析工具调用
 */

import { ToolCall } from './types';

/**
 * 修复 JSON 字符串值中的未转义特殊字符
 */
function fixUnescapedChars(jsonStr: string): string {
  let fixed = '';
  let inString = false;
  let prevChar = '';
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    // 检查引号（未被转义的）
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      fixed += char;
    } else if (inString) {
      // 在字符串内部，转义特殊字符
      if (char === '\n') {
        fixed += '\\n';
      } else if (char === '\r') {
        fixed += '\\r';
      } else if (char === '\t') {
        fixed += '\\t';
      } else {
        fixed += char;
      }
    } else {
      // 在字符串外部
      fixed += char;
    }
    
    // 更新前一个字符（处理连续反斜杠）
    prevChar = (char === '\\' && prevChar === '\\') ? '' : char;
  }
  
  return fixed;
}

/**
 * 多层 JSON 修复策略
 */
function repairJson(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // 1. 移除注释
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');
  repaired = repaired.replace(/\/\/[^\n]*/g, '');
  
  // 2. 修复未转义的特殊字符
  repaired = fixUnescapedChars(repaired);
  
  // 3. 移除尾随逗号
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // 4. 修复单引号（JSON 只支持双引号）
  // 注意：这个比较危险，可能误伤字符串内容
  // repaired = repaired.replace(/'([^']*?)'/g, '"$1"');
  
  return repaired;
}

/**
 * 修复 content 字段中的未转义换行符
 * 特别处理 write_file 工具的 content 参数
 */
function fixContentField(jsonStr: string): string {
  // 找到 "content": " 的位置
  const contentStart = jsonStr.indexOf('"content"');
  if (contentStart === -1) return jsonStr;
  
  // 找到值开始的引号
  const valueStart = jsonStr.indexOf('"', jsonStr.indexOf(':', contentStart) + 1);
  if (valueStart === -1) return jsonStr;
  
  // 找到值结束的位置（下一个未转义的引号，或者 } 之前）
  let valueEnd = valueStart + 1;
  let depth = 0;
  
  while (valueEnd < jsonStr.length) {
    const char = jsonStr[valueEnd];
    
    // 遇到换行符，说明字符串未正确结束
    if (char === '\n' || char === '\r') {
      // 继续查找，直到找到可能的结束位置
      valueEnd++;
      continue;
    }
    
    // 遇到 } 或 ]，可能是字符串结束
    if ((char === '}' || char === ']' || char === ',') && depth === 0) {
      // 回退找到最后一个引号位置
      let lastQuote = valueEnd - 1;
      while (lastQuote > valueStart && jsonStr[lastQuote] !== '"') {
        lastQuote--;
      }
      if (lastQuote > valueStart) {
        valueEnd = lastQuote;
        break;
      }
    }
    
    valueEnd++;
  }
  
  // 提取 content 值
  const content = jsonStr.substring(valueStart + 1, valueEnd);
  
  // 转义特殊字符
  const escaped = content
    .replace(/\\/g, '\\\\')  // 转义反斜杠
    .replace(/\n/g, '\\n')   // 转义换行符
    .replace(/\r/g, '\\r')   // 转义回车符
    .replace(/\t/g, '\\t')   // 转义制表符
    .replace(/"/g, '\\"');   // 转义双引号
  
  // 重建 JSON
  return jsonStr.substring(0, valueStart + 1) + escaped + '"' + jsonStr.substring(valueEnd + 1);
}

/**
 * 尝试解析 JSON，使用多种策略
 */
function tryParseJson(jsonStr: string): any {
  const strategies = [
    // 策略 1: 直接解析
    (str: string) => JSON.parse(str),
    
    // 策略 2: 修复后解析
    (str: string) => JSON.parse(repairJson(str)),
    
    // 策略 3: 额外移除尾随逗号后解析
    (str: string) => {
      const cleaned = repairJson(str)
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(cleaned);
    },
    
    // 策略 4: 修复 content 字段中的未转义换行符
    (str: string) => {
      const fixed = fixContentField(str);
      return JSON.parse(fixed);
    },
    
    // 策略 5: 组合修复
    (str: string) => {
      const fixed = fixContentField(repairJson(str));
      return JSON.parse(fixed);
    },
  ];
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      return { success: true, data: strategies[i](jsonStr), strategy: i };
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }
  
  return { success: false, error: lastError };
}

/**
 * 解析 AI 响应中的工具调用
 */
export function parseToolCalls(content: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  const regex = /```tool:(\w+)\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const tool = match[1];
    const jsonContent = match[2];
    
    const result = tryParseJson(jsonContent);
    
    if (result.success) {
      toolCalls.push({ tool, parameters: result.data });
      
      // 只在使用了修复策略时输出日志
      if (result.strategy > 0) {
        console.log(`✓ 工具 ${tool} 使用策略 ${result.strategy} 解析成功`);
      }
    } else {
      console.error(`✗ 工具 ${tool} 解析失败:`, result.error?.message);
      console.error('JSON 内容预览:', jsonContent.substring(0, 200) + '...');
    }
  }

  return toolCalls;
}
