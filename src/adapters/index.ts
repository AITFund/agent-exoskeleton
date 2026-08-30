import type { AgentDefinition } from '../loader.js';
import { exportClaudeCode } from './claude-code.js';
import { exportOpenAI } from './openai.js';
import { exportRaw } from './raw.js';
import { exportHermes } from './hermes.js';
import { exportWorkspaceMarkdown } from './workspace-markdown.js';

export type AdapterName = 'claude-code' | 'openai' | 'raw' | 'hermes' | 'workspace-markdown';

const adapters: Record<AdapterName, (agent: AgentDefinition) => string> = {
  'claude-code': exportClaudeCode,
  openai: exportOpenAI,
  raw: exportRaw,
  hermes: exportHermes,
  'workspace-markdown': exportWorkspaceMarkdown,
};

export function getAdapter(
  name: string,
): ((agent: AgentDefinition) => string) | undefined {
  return adapters[name as AdapterName];
}

export function listAdapters(): AdapterName[] {
  return Object.keys(adapters) as AdapterName[];
}

export { exportClaudeCode, exportOpenAI, exportRaw, exportHermes, exportWorkspaceMarkdown };
