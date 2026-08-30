import type { AgentDefinition } from '../loader.js';
import { readOperatingFiles } from './operating-files.js';

/** Export an onboarding-ready Markdown packet for a workspace doc. */
export function exportWorkspaceMarkdown(agent: AgentDefinition): string {
  const m = agent.manifest;
  const lines: string[] = [];
  lines.push(`# ${m.name} workspace onboarding`);
  lines.push('');
  lines.push(m.description);
  lines.push('');
  lines.push('## What to ask the human for');
  lines.push('');
  lines.push('- Confirm you have been added to the workspace.');
  lines.push('- Ask for your agent API key through the approved secure channel.');
  lines.push('- Ask which workspace channels, docs, tasks, and inboxes you are directly responsible for.');
  lines.push('- Ask which actions require explicit approval before execution.');
  lines.push('');
  lines.push('## Required local setup');
  lines.push('');
  lines.push('- Store secrets outside the repo with owner-only permissions.');
  lines.push('- Use a wrapper or credential gateway so tokens are not pasted into logs.');
  lines.push('- Run identity, workspace, document, task, mail, and permission read-back checks before relying on automation.');
  lines.push('');
  if (m.communication?.activation) {
    lines.push('## Channel activation');
    lines.push('');
    for (const [channel, cfg] of Object.entries(m.communication.activation)) {
      lines.push(`- ${channel}: posture=${cfg.posture ?? 'ambient'}`);
      if (cfg.respond_when?.length) lines.push(`  - respond_when: ${cfg.respond_when.join(', ')}`);
      if (cfg.ignore?.length) lines.push(`  - ignore: ${cfg.ignore.join(', ')}`);
    }
    lines.push('');
  }
  lines.push('## Operating files');
  lines.push('');
  for (const file of readOperatingFiles(agent.basePath)) {
    lines.push(`### ${file.path}`);
    lines.push('```');
    lines.push(file.content.trim());
    lines.push('```');
    lines.push('');
  }
  lines.push('## Skills and rules');
  lines.push('');
  for (const rule of agent.rules) lines.push(rule.trim(), '');
  for (const skill of agent.skills) lines.push(`### ${skill.metadata.name}`, '', skill.body.trim(), '');
  return lines.join('\n').trim() + '\n';
}
