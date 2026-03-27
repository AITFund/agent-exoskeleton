import type { AgentDefinition } from '../loader.js';
import { exportClaudeCode } from './claude-code.js';
import { exportOpenAI } from './openai.js';
import { exportRaw } from './raw.js';

export type AdapterName = 'claude-code' | 'openai' | 'raw';

const adapters: Record<AdapterName, (agent: AgentDefinition) => string> = {
  'claude-code': exportClaudeCode,
  openai: exportOpenAI,
  raw: exportRaw,
};

export function getAdapter(
  name: string,
): ((agent: AgentDefinition) => string) | undefined {
  return adapters[name as AdapterName];
}

export function listAdapters(): AdapterName[] {
  return Object.keys(adapters) as AdapterName[];
}

export { exportClaudeCode, exportOpenAI, exportRaw };
