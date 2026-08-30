import type { AgentDefinition } from '../loader.js';
import { readOperatingFiles } from './operating-files.js';

/**
 * Hermes adapter.
 *
 * Exports a Hermes-oriented system prompt with explicit skill-loading,
 * channel activation, operating-loop, credential, policy, and verification
 * sections. It remains runtime-portable: the files describe shape and
 * contracts, not private deployment state or secrets.
 */
export function exportHermes(agent: AgentDefinition): string {
  const sections: string[] = [];
  const { manifest } = agent;

  sections.push(agent.identity.trim());

  if (manifest.communication?.activation) {
    const lines = ['## Channel Activation', ''];
    for (const [channel, cfg] of Object.entries(manifest.communication.activation)) {
      lines.push(`### ${channel}`);
      if (cfg.posture) lines.push(`- Posture: ${cfg.posture}`);
      if (cfg.respond_when?.length) lines.push(`- Respond when: ${cfg.respond_when.join(', ')}`);
      if (cfg.ignore?.length) lines.push(`- Ignore: ${cfg.ignore.join(', ')}`);
      lines.push('');
    }
    sections.push(lines.join('\n').trim());
  }

  if (agent.rules.length > 0) {
    sections.push(agent.rules.map((r) => r.trim()).join('\n\n'));
  }

  if (agent.skills.length > 0) {
    const lines = [
      '## Skills',
      '',
      'Load a skill when its description matches the task. Follow its instructions before general reasoning.',
      '',
    ];
    for (const skill of agent.skills) {
      lines.push(`### ${skill.metadata.name}`);
      if (skill.metadata.description) lines.push(skill.metadata.description);
      lines.push('');
      lines.push(skill.body.trim());
      lines.push('');
    }
    sections.push(lines.join('\n').trim());
  }

  const operatingFiles = readOperatingFiles(agent.basePath);
  if (operatingFiles.length > 0) {
    const lines = [
      '## Operating Exoskeleton',
      '',
      'These public files define authority, connections, schedules, state, and verification contracts. They are not secrets.',
      '',
    ];
    for (const file of operatingFiles) {
      lines.push(`### ${file.path}`);
      lines.push('```');
      lines.push(file.content.trim());
      lines.push('```');
      lines.push('');
    }
    sections.push(lines.join('\n').trim());
  }

  for (const entry of agent.knowledge.entries.filter((e) => e.always_load)) {
    const content = agent.knowledge.documents[entry.path];
    if (content) sections.push(`## ${entry.description}\n\n${content.trim()}`);
  }

  if (agent.memory) sections.push(`## Memory\n\n${agent.memory.trim()}`);

  return sections.join('\n\n---\n\n') + '\n';
}
