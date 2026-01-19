/**
 * Extract code block content from AI response
 * Used to extract large file content from code blocks instead of tool parameters
 */

export interface CodeBlock {
  language: string;
  filename?: string;
  content: string;
}

/**
 * Extract code blocks from markdown content
 * Supports format: ```language:filename
 */
export function extractCodeBlocks(content: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const regex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)```/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const [, language, filename, blockContent] = match;
    codeBlocks.push({
      language,
      filename: filename?.trim(),
      content: blockContent,
    });
  }
  
  return codeBlocks;
}

/**
 * Find code block by filename
 */
export function findCodeBlockByFilename(content: string, filename: string): CodeBlock | null {
  const blocks = extractCodeBlocks(content);
  return blocks.find(block => block.filename === filename) || null;
}

/**
 * Check if content is a reference to a code block
 */
export function isCodeBlockReference(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  return normalized.includes('[see code block') || 
         normalized.includes('[参考上面的代码块') ||
         normalized.includes('[见上面的代码块') ||
         normalized === '[see above]' ||
         normalized === '[参考上文]';
}
