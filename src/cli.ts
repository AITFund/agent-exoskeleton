#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { loadAgent } from './loader.js';
import { getAdapter, listAdapters } from './adapters/index.js';
import { validate } from './validate.js';

const args = process.argv.slice(2);
const command = args[0];

function usage(): void {
  console.log(`agent-exoskeleton — Lightweight agent definition toolkit

Usage:
  agent-exo init <dir> [--template <name>]   Scaffold a new agent from a template
  agent-exo validate <dir>                   Validate an agent definition
  agent-exo export <dir> --adapter <name>    Export to a runtime-specific format
  agent-exo info <dir>                       Show agent summary
  agent-exo adapters                         List available adapters

Templates: minimal (default)
Adapters:  ${listAdapters().join(', ')}
`);
}

function getFlag(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return undefined;
}

function cmdInit(): void {
  const dir = args[1];
  if (!dir) {
    console.error('Error: directory required. Usage: agent-exo init <dir>');
    process.exit(1);
  }

  const templateName = getFlag('--template') || 'minimal';
  const templateDir = path.join(
    import.meta.dirname,
    '..',
    'templates',
    templateName,
  );

  if (!fs.existsSync(templateDir)) {
    console.error(`Error: template "${templateName}" not found`);
    process.exit(1);
  }

  const targetDir = path.resolve(dir);
  copyDir(templateDir, targetDir);
  console.log(`Agent scaffolded at ${targetDir} (template: ${templateName})`);
  console.log('Next steps:');
  console.log('  1. Edit agent.yaml — set name, description, skills, tools');
  console.log('  2. Edit IDENTITY.md — define personality and expertise');
  console.log('  3. Run: agent-exo validate ' + dir);
}

function cmdValidate(): void {
  const dir = args[1];
  if (!dir) {
    console.error('Error: directory required. Usage: agent-exo validate <dir>');
    process.exit(1);
  }

  const result = validate(dir);

  if (result.errors.length > 0) {
    console.log('ERRORS:');
    for (const err of result.errors) {
      console.log(`  ✗ ${err}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('WARNINGS:');
    for (const warn of result.warnings) {
      console.log(`  ⚠ ${warn}`);
    }
  }

  if (result.valid) {
    console.log('Valid agent definition.');
  } else {
    process.exit(1);
  }
}

function cmdExport(): void {
  const dir = args[1];
  const adapterName = getFlag('--adapter');
  const outPath = getFlag('--out');

  if (!dir || !adapterName) {
    console.error(
      'Error: directory and adapter required. Usage: agent-exo export <dir> --adapter <name>',
    );
    process.exit(1);
  }

  const adapter = getAdapter(adapterName);
  if (!adapter) {
    console.error(
      `Error: unknown adapter "${adapterName}". Available: ${listAdapters().join(', ')}`,
    );
    process.exit(1);
  }

  const agent = loadAgent(dir);
  const output = adapter(agent);

  if (outPath) {
    fs.writeFileSync(outPath, output);
    console.log(`Exported to ${outPath} (adapter: ${adapterName})`);
  } else {
    process.stdout.write(output);
  }
}

function cmdInfo(): void {
  const dir = args[1];
  if (!dir) {
    console.error('Error: directory required. Usage: agent-exo info <dir>');
    process.exit(1);
  }

  const agent = loadAgent(dir);
  const m = agent.manifest;

  console.log(`Name:        ${m.name}`);
  console.log(`Version:     ${m.version}`);
  console.log(`Description: ${m.description}`);
  console.log(`Spec:        ${m.spec_version}`);
  if (m.model?.preferred) console.log(`Model:       ${m.model.preferred}`);
  if (m.skills?.length) console.log(`Skills:      ${m.skills.join(', ')}`);
  if (m.tools?.length) console.log(`Tools:       ${m.tools.join(', ')}`);
  if (m.agents) console.log(`Sub-agents:  ${Object.keys(m.agents).join(', ')}`);
  if (m.communication?.channels)
    console.log(`Channels:    ${m.communication.channels.join(', ')}`);
  if (m.metadata?.tags) console.log(`Tags:        ${m.metadata.tags.join(', ')}`);
}

function cmdAdapters(): void {
  console.log('Available adapters:');
  for (const name of listAdapters()) {
    console.log(`  - ${name}`);
  }
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

switch (command) {
  case 'init':
    cmdInit();
    break;
  case 'validate':
    cmdValidate();
    break;
  case 'export':
    cmdExport();
    break;
  case 'info':
    cmdInfo();
    break;
  case 'adapters':
    cmdAdapters();
    break;
  default:
    usage();
    if (command && command !== '--help' && command !== '-h') {
      process.exit(1);
    }
}
