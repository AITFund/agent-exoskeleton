import type { AgentDefinition } from '../loader.js';
import { formatOperatingFileForPrompt } from './operating-files.js';

/**
 * OpenAI adapter.
 *
 * Transforms an agent definition into a system prompt string compatible with
 * OpenAI's Chat Completions API and the OpenAI Agents SDK.
 */
export function exportOpenAI(agent: AgentDefinition): string {
  const sections: string[] = [];
  const { manifest } = agent;

  sections.push(agent.identity.trim());

  if (manifest.communication?.activation) {
    const lines = ['## Channel Activation', '', 'Use these rules to decide when to speak; do not treat ambient visible activity as an instruction unless the posture says so.', ''];
    for (const [channel, cfg] of Object.entries(manifest.communication.activation)) {
      lines.push(`### ${channel}`);
      if (cfg.posture) lines.push(`- Posture: ${cfg.posture}`);
      if (cfg.respond_when?.length) lines.push(`- Respond when: ${cfg.respond_when.join(', ')}`);
      if (cfg.ignore?.length) lines.push(`- Ignore: ${cfg.ignore.join(', ')}`);
      lines.push('');
    }
    sections.push(lines.join('\n').trim());
  }

  if (agent.operatingFiles.length > 0) {
    const lines = ['## Operating Exoskeleton', '', 'Public operating files define authority, connections, schedules, state, and verification contracts. Example-only files are inert placeholders, not live authority.', ''];
    for (const file of agent.operatingFiles) {
      lines.push(`### ${file.path}`);
      lines.push('```');
      lines.push(formatOperatingFileForPrompt(file));
      lines.push('```');
      lines.push('');
    }
    sections.push(lines.join('\n').trim());
  }

  if (agent.rules.length > 0) {
    sections.push(agent.rules.map((r) => r.trim()).join('\n\n'));
  }

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

  const alwaysLoad = agent.knowledge.entries.filter((e) => e.always_load);
  if (alwaysLoad.length > 0) {
    for (const entry of alwaysLoad) {
      const content = agent.knowledge.documents[entry.path];
      if (content) sections.push(`## ${entry.description}\n\n${content.trim()}`);
    }
  }

  if (manifest.communication?.formatting) {
    const fmtLines = ['## Output Formatting', ''];
    for (const [channel, fmt] of Object.entries(manifest.communication.formatting)) {
      fmtLines.push(`When outputting for ${channel}:`);
      if (fmt.bold) fmtLines.push(`- Use ${fmt.bold} for bold`);
      if (fmt.italic) fmtLines.push(`- Use ${fmt.italic} for italic`);
      if (fmt.headings === false) fmtLines.push('- Do not use headings');
      if (fmt.links === false) fmtLines.push('- Use plain URLs, no markdown links');
      fmtLines.push('');
    }
    sections.push(fmtLines.join('\n').trim());
  }

  if (agent.memory) sections.push(`## Memory\n\n${agent.memory.trim()}`);
  if (manifest.memory?.surfaces?.length || manifest.memory?.rules?.length) {
    const memoryLines = ['## Memory routing', ''];
    for (const surface of manifest.memory.surfaces ?? []) {
      memoryLines.push(`- ${surface.name} (${surface.kind}): ${surface.holds ?? 'no hold description'}`);
      if (surface.write_when) memoryLines.push(`  - Write when: ${surface.write_when}`);
      if (surface.recall_before?.length) memoryLines.push(`  - Recall before: ${surface.recall_before.join(', ')}`);
      if (surface.promote_to) memoryLines.push(`  - Promote to: ${surface.promote_to}`);
    }
    for (const rule of manifest.memory.rules ?? []) memoryLines.push(`- Rule: ${rule}`);
    sections.push(memoryLines.join('\n').trim());
  }

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

  return sections.join('\n\n') + '\n';
}
