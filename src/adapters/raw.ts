import type { AgentDefinition } from '../loader.js';

/**
 * Raw adapter.
 *
 * Concatenates all agent content into a single Markdown document.
 * No runtime-specific formatting — just the raw agent definition
 * assembled in order. Useful for debugging, review, or feeding
 * into any LLM as a system prompt.
 */
export function exportRaw(agent: AgentDefinition): string {
  const parts: string[] = [];

  // Identity
  parts.push(agent.identity.trim());

  // Rules
  for (const rule of agent.rules) {
    parts.push(rule.trim());
  }

  // Skills
  for (const skill of agent.skills) {
    parts.push(`## Skill: ${skill.metadata.name}\n\n${skill.body}`);
  }

  // Knowledge (always-load)
  for (const entry of agent.knowledge.entries.filter((e) => e.always_load)) {
    const content = agent.knowledge.documents[entry.path];
    if (content) {
      parts.push(`## ${entry.description}\n\n${content.trim()}`);
    }
  }

  // Memory
  if (agent.memory) {
    parts.push(`## Memory\n\n${agent.memory.trim()}`);
  }

  // Sub-agents
  for (const [name, sub] of Object.entries(agent.subAgents)) {
    parts.push(
      `## Sub-agent: ${sub.manifest.name}\n\n${sub.manifest.description}`,
    );
  }

  return parts.join('\n\n---\n\n') + '\n';
}
