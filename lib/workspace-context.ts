/**
 * 工作区上下文
 * 提供全局的工作区路径访问
 */

let currentWorkspacePath = './workspace';

export function setWorkspacePath(path: string) {
  currentWorkspacePath = path;
}

export function getWorkspacePath(): string {
  return currentWorkspacePath;
}
