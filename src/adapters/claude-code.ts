import type { AgentDefinition, FormattingConfig } from '../loader.js';
import { formatOperatingFileForPrompt } from './operating-files.js';

/**
 * Claude Code adapter.
 *
 * Transforms an agent definition into a CLAUDE.md file compatible with
 * Claude Code CLI and the Claude Agent SDK.
 */
export function exportClaudeCode(agent: AgentDefinition): string {
  const sections: string[] = [];
  const { manifest } = agent;

  sections.push(agent.identity.trim());

  if (manifest.communication?.activation) {
    sections.push(buildActivationSection(manifest.communication.activation));
  }

  if (manifest.communication?.formatting) {
    sections.push(buildFormattingSection(manifest.communication.formatting));
  }

  if (agent.operatingFiles.length > 0) {
    sections.push(buildOperatingSection(agent));
  }

  if (agent.rules.length > 0) {
    for (const rule of agent.rules) sections.push(rule.trim());
  }

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

  const memorySection = buildMemorySection(agent);
  if (memorySection) sections.push(memorySection);

  if (manifest.peers && Object.keys(manifest.peers).length > 0) {
    const peerLines = ['## Peer agents and handoffs', ''];
    for (const [name, peer] of Object.entries(manifest.peers)) {
      peerLines.push(`### ${name}`);
      if (peer.owns?.length) peerLines.push(`- Owns: ${peer.owns.join(', ')}`);
      if (peer.handoff) peerLines.push(`- Handoff: ${peer.handoff}`);
      peerLines.push('');
    }
    sections.push(peerLines.join('\n').trim());
  }

  if (Object.keys(agent.subAgents).length > 0) {
    const agentLines = ['## Sub-agents', ''];
    for (const [name, sub] of Object.entries(agent.subAgents)) {
      const delegation = manifest.agents?.[name]?.delegation || 'manual';
      agentLines.push(`### ${sub.manifest.name} (${delegation})`);
      agentLines.push('');
      agentLines.push(sub.manifest.description);
      agentLines.push('');
    }
    sections.push(agentLines.join('\n').trim());
  }

  return sections.join('\n\n---\n\n') + '\n';
}

function buildActivationSection(activation: NonNullable<AgentDefinition['manifest']['communication']>['activation']): string {
  const lines = ['## Channel Activation', '', 'Use these rules to decide when to speak. Activation posture is separate from channel pacing.',''];
  for (const [channel, cfg] of Object.entries(activation ?? {})) {
    lines.push(`### ${channel}`);
    if (cfg.posture) lines.push(`- Posture: ${cfg.posture}`);
    if (cfg.respond_when?.length) lines.push(`- Respond when: ${cfg.respond_when.join(', ')}`);
    if (cfg.ignore?.length) lines.push(`- Ignore: ${cfg.ignore.join(', ')}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

function buildOperatingSection(agent: AgentDefinition): string {
  const lines = [
    '## Operating Exoskeleton',
    '',
    'Public operating files define authority, connections, schedules, state, and verification contracts. Example-only files are inert placeholders, not live authority.',
    '',
  ];
  for (const file of agent.operatingFiles) {
    lines.push(`### ${file.path}`);
    lines.push('```');
    lines.push(formatOperatingFileForPrompt(file));
    lines.push('```');
    lines.push('');
  }
  return lines.join('\n').trim();
}

function buildMemorySection(agent: AgentDefinition): string | null {
  const lines: string[] = [];
  if (agent.memory) lines.push('## Memory', '', agent.memory.trim(), '');
  else if (agent.manifest.memory?.strategy === 'file-based') {
    lines.push('## Memory', '', 'When you learn something important:', '- Create files for structured data', '- Keep an index of files you create', '- Use the `conversations/` folder for searchable history', '');
  }
  if (agent.manifest.memory?.surfaces?.length || agent.manifest.memory?.rules?.length) {
    if (lines.length === 0) lines.push('## Memory');
    lines.push('### Memory routing');
    for (const surface of agent.manifest.memory.surfaces ?? []) {
      lines.push(`- ${surface.name} (${surface.kind})`);
      if (surface.path) lines.push(`  - Path: ${surface.path}`);
      if (surface.tool) lines.push(`  - Tool: ${surface.tool}`);
      if (surface.holds) lines.push(`  - Holds: ${surface.holds}`);
      if (surface.write_when) lines.push(`  - Write when: ${surface.write_when}`);
      if (surface.recall_before?.length) lines.push(`  - Recall before: ${surface.recall_before.join(', ')}`);
      if (surface.promote_to) lines.push(`  - Promote to: ${surface.promote_to}`);
    }
    for (const rule of agent.manifest.memory.rules ?? []) lines.push(`- Rule: ${rule}`);
  }
  return lines.length ? lines.join('\n').trim() : null;
}

function buildFormattingSection(formatting: Record<string, FormattingConfig>): string {
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
