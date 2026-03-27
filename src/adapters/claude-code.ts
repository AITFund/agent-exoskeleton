import type { AgentDefinition, FormattingConfig } from '../loader.js';

/**
 * Claude Code adapter.
 *
 * Transforms an agent definition into a CLAUDE.md file compatible with
 * Claude Code CLI and the Claude Agent SDK.
 */
export function exportClaudeCode(agent: AgentDefinition): string {
  const sections: string[] = [];
  const { manifest } = agent;

  // --- Identity ---
  sections.push(agent.identity.trim());

  // --- Communication / Formatting ---
  if (manifest.communication?.formatting) {
    sections.push(buildFormattingSection(manifest.communication.formatting));
  }

  // --- Rules ---
  if (agent.rules.length > 0) {
    for (const rule of agent.rules) {
      sections.push(rule.trim());
    }
  }

  // --- Skills ---
  if (agent.skills.length > 0) {
    const skillLines = ['## Skills', ''];
    for (const skill of agent.skills) {
      skillLines.push(`### ${skill.metadata.name}`);
      skillLines.push('');
      skillLines.push(skill.body);
      skillLines.push('');
    }
    sections.push(skillLines.join('\n').trim());
  }

  // --- Knowledge (always-load documents) ---
  const alwaysLoad = agent.knowledge.entries.filter((e) => e.always_load);
  if (alwaysLoad.length > 0) {
    const knowledgeLines = ['## Reference Documents', ''];
    for (const entry of alwaysLoad) {
      const content = agent.knowledge.documents[entry.path];
      if (content) {
        knowledgeLines.push(`### ${entry.description}`);
        knowledgeLines.push('');
        knowledgeLines.push(content.trim());
        knowledgeLines.push('');
      }
    }
    sections.push(knowledgeLines.join('\n').trim());
  }

  // --- Memory ---
  if (agent.memory) {
    sections.push('## Memory\n\n' + agent.memory.trim());
  } else if (manifest.memory?.strategy === 'file-based') {
    sections.push(
      [
        '## Memory',
        '',
        'When you learn something important:',
        '- Create files for structured data',
        '- Keep an index of files you create',
        '- Use the `conversations/` folder for searchable history',
      ].join('\n'),
    );
  }

  // --- Sub-agents ---
  if (Object.keys(agent.subAgents).length > 0) {
    const agentLines = ['## Sub-agents', ''];
    for (const [name, sub] of Object.entries(agent.subAgents)) {
      const delegation =
        manifest.agents?.[name]?.delegation || 'manual';
      agentLines.push(`### ${sub.manifest.name} (${delegation})`);
      agentLines.push('');
      agentLines.push(sub.manifest.description);
      agentLines.push('');
    }
    sections.push(agentLines.join('\n').trim());
  }

  return sections.join('\n\n---\n\n') + '\n';
}

function buildFormattingSection(
  formatting: Record<string, FormattingConfig>,
): string {
  const lines = ['## Message Formatting', '', 'Format messages based on the channel:', ''];

  for (const [channel, fmt] of Object.entries(formatting)) {
    lines.push(`### ${capitalize(channel)}`);
    lines.push('');
    if (fmt.bold) lines.push(`- Bold: \`${fmt.bold}\``);
    if (fmt.italic) lines.push(`- Italic: \`${fmt.italic}\``);
    if (fmt.links === false) {
      lines.push('- Links: plain URLs only (no markdown links)');
    } else if (typeof fmt.links === 'string') {
      lines.push(`- Links: \`${fmt.links}\``);
    }
    if (fmt.headings === false) lines.push('- No headings (`##`, `###`, etc.)');
    if (fmt.headings === true) lines.push('- Markdown headings supported');
    if (fmt.code_blocks) lines.push('- Code blocks: supported');
    if (fmt.bullets) lines.push(`- Bullets: \`${fmt.bullets}\``);
    lines.push('');
  }

  return lines.join('\n').trim();
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
