import type { AgentDefinition } from '../loader.js';

/**
 * OpenAI adapter.
 *
 * Transforms an agent definition into a system prompt string compatible with
 * OpenAI's Chat Completions API and the OpenAI Agents SDK.
 */
export function exportOpenAI(agent: AgentDefinition): string {
  const sections: string[] = [];
  const { manifest } = agent;

  // --- Identity ---
  sections.push(agent.identity.trim());

  // --- Rules ---
  if (agent.rules.length > 0) {
    sections.push(agent.rules.map((r) => r.trim()).join('\n\n'));
  }

  // --- Skills (inline as instructions) ---
  if (agent.skills.length > 0) {
    const skillLines: string[] = [];
    for (const skill of agent.skills) {
      skillLines.push(`## ${skill.metadata.name}`);
      skillLines.push(skill.metadata.description);
      skillLines.push('');
      skillLines.push(skill.body);
      skillLines.push('');
    }
    sections.push(skillLines.join('\n').trim());
  }

  // --- Knowledge (always-load) ---
  const alwaysLoad = agent.knowledge.entries.filter((e) => e.always_load);
  if (alwaysLoad.length > 0) {
    for (const entry of alwaysLoad) {
      const content = agent.knowledge.documents[entry.path];
      if (content) {
        sections.push(`## ${entry.description}\n\n${content.trim()}`);
      }
    }
  }

  // --- Formatting ---
  if (manifest.communication?.formatting) {
    const fmtLines = ['## Output Formatting', ''];
    for (const [channel, fmt] of Object.entries(
      manifest.communication.formatting,
    )) {
      fmtLines.push(`When outputting for ${channel}:`);
      if (fmt.bold) fmtLines.push(`- Use ${fmt.bold} for bold`);
      if (fmt.italic) fmtLines.push(`- Use ${fmt.italic} for italic`);
      if (fmt.headings === false) fmtLines.push('- Do not use headings');
      if (fmt.links === false) fmtLines.push('- Use plain URLs, no markdown links');
      fmtLines.push('');
    }
    sections.push(fmtLines.join('\n').trim());
  }

  // --- Memory ---
  if (agent.memory) {
    sections.push(agent.memory.trim());
  }

  return sections.join('\n\n') + '\n';
}
