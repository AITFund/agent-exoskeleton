import fs from 'fs';
import path from 'path';
import _Ajv from 'ajv';
import _addFormats from 'ajv-formats';

const Ajv = _Ajv as unknown as typeof _Ajv.default;
const addFormats = _addFormats as unknown as typeof _addFormats.default;
import yaml from 'js-yaml';

import type { AgentManifest, SkillMetadata } from './loader.js';

const SCHEMA_PATH = path.join(import.meta.dirname, '..', 'spec', 'schemas', 'agent.schema.json');
const WELL_KNOWN_TOOLS = new Set([
  'bash', 'file_read', 'file_write', 'web_fetch', 'web_search', 'send_message', 'send_email',
  'schedule_task', 'list_tasks', 'pause_task', 'resume_task', 'cancel_task', 'browser',
]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validate(agentDir: string): ValidationResult {
  const absDir = path.resolve(agentDir);
  const errors: string[] = [];
  const warnings: string[] = [];

  const manifestPath = path.join(absDir, 'agent.yaml');
  if (!fs.existsSync(manifestPath)) {
    errors.push('Missing required file: agent.yaml');
    return { valid: false, errors, warnings };
  }

  const identityPath = path.join(absDir, 'IDENTITY.md');
  if (!fs.existsSync(identityPath)) errors.push('Missing required file: IDENTITY.md');

  let manifest: AgentManifest;
  try {
    manifest = yaml.load(fs.readFileSync(manifestPath, 'utf-8')) as AgentManifest;
  } catch (e) {
    errors.push(`Invalid YAML in agent.yaml: ${(e as Error).message}`);
    return { valid: false, errors, warnings };
  }

  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    for (const err of validateSchema.errors || []) errors.push(`agent.yaml${err.instancePath}: ${err.message}`);
  }

  warnOnSpecMajorMismatch(manifest, warnings);

  if (manifest.skills) {
    for (const skill of manifest.skills) {
      const skillPath = path.join(absDir, 'skills', skill, 'SKILL.md');
      if (!fs.existsSync(skillPath)) {
        errors.push(`Skill "${skill}" declared in agent.yaml but skills/${skill}/SKILL.md not found`);
        continue;
      }
      const metadata = parseSkillMetadata(skillPath);
      for (const tool of metadata?.tools ?? []) {
        if (!(manifest.tools ?? []).includes(tool) && !WELL_KNOWN_TOOLS.has(tool)) {
          warnings.push(`Skill "${skill}" declares tool "${tool}" but agent.yaml tools does not include it`);
        }
      }
    }
  }

  if (manifest.agents) {
    for (const agentName of Object.keys(manifest.agents)) {
      const subDir = path.join(absDir, 'agents', agentName, 'agent.yaml');
      if (!fs.existsSync(subDir)) warnings.push(`Sub-agent "${agentName}" declared but agents/${agentName}/agent.yaml not found`);
    }
  }

  if (fs.existsSync(identityPath)) {
    const lines = fs.readFileSync(identityPath, 'utf-8').split('\n').length;
    if (lines > 500) warnings.push(`IDENTITY.md is ${lines} lines — recommended max is 500`);
  }

  validateKnowledgeIndex(absDir, errors);
  validateOperatingReferences(absDir, manifest, errors);
  validateConnectionEnv(absDir, manifest, errors);
  warnOnApprovalWithoutVerification(absDir, manifest, warnings);
  warnOnRulesWithoutPrecedence(absDir, warnings);

  return { valid: errors.length === 0, errors, warnings };
}

function parseSkillMetadata(skillPath: string): SkillMetadata | null {
  const content = fs.readFileSync(skillPath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fmMatch) return null;
  try { return yaml.load(fmMatch[1]) as SkillMetadata; } catch { return null; }
}

function validateKnowledgeIndex(absDir: string, errors: string[]): void {
  const knowledgeIndex = path.join(absDir, 'knowledge', 'index.yaml');
  if (!fs.existsSync(knowledgeIndex)) return;
  try {
    const index = yaml.load(fs.readFileSync(knowledgeIndex, 'utf-8')) as { documents?: { path: string }[] };
    for (const doc of index.documents || []) {
      const docPath = path.join(absDir, 'knowledge', doc.path);
      if (!fs.existsSync(docPath)) errors.push(`Knowledge document "${doc.path}" referenced in index but not found`);
    }
  } catch {
    errors.push('Invalid YAML in knowledge/index.yaml');
  }
}

function validateOperatingReferences(absDir: string, manifest: AgentManifest, errors: string[]): void {
  for (const [key, value] of Object.entries(manifest.policy ?? {})) {
    if (typeof value === 'string') assertPathExists(absDir, value, `policy.${key}`, errors);
  }
  for (const name of manifest.connections ?? []) {
    const candidates = [`connections/${name}.yaml`, `connections/${name}.yml`, `connections/${name}.json`];
    if (!candidates.some((candidate) => fs.existsSync(path.join(absDir, candidate)))) {
      errors.push(`connections entry "${name}" has no connections/${name}.yaml, .yml, or .json file`);
    }
  }
  for (const [section, value] of Object.entries(manifest.ops ?? {})) {
    if (Array.isArray(value)) {
      for (const rel of value) if (typeof rel === 'string') assertPathExists(absDir, rel, `ops.${section}`, errors);
    }
  }
  const contracts = manifest.verification?.contracts;
  if (Array.isArray(contracts)) {
    for (const rel of contracts) if (typeof rel === 'string') assertPathExists(absDir, rel, 'verification.contracts', errors);
  }
}

function assertPathExists(absDir: string, rel: string, field: string, errors: string[]): void {
  if (path.isAbsolute(rel) || rel.includes('..')) {
    errors.push(`${field} references unsafe path "${rel}"`);
    return;
  }
  if (!fs.existsSync(path.join(absDir, rel))) errors.push(`${field} references missing path "${rel}"`);
}

function validateConnectionEnv(absDir: string, manifest: AgentManifest, errors: string[]): void {
  const files = connectionFiles(absDir, manifest);
  for (const file of files) {
    let doc: unknown;
    try { doc = yaml.load(fs.readFileSync(file, 'utf-8')); } catch { errors.push(`Invalid YAML in ${path.relative(absDir, file)}`); continue; }
    const required = (doc as { required_env?: unknown })?.required_env;
    if (!Array.isArray(required)) continue;
    for (const entry of required) {
      if (typeof entry !== 'string' || !/^[A-Z_][A-Z0-9_]*$/.test(entry) || /[=:\/\s]/.test(entry)) {
        errors.push(`${path.relative(absDir, file)} required_env entry must be an environment variable name, not a value`);
      }
    }
  }
}

function connectionFiles(absDir: string, manifest: AgentManifest): string[] {
  const out: string[] = [];
  for (const name of manifest.connections ?? []) {
    for (const ext of ['yaml', 'yml', 'json']) {
      const file = path.join(absDir, 'connections', `${name}.${ext}`);
      if (fs.existsSync(file)) out.push(file);
    }
  }
  return out;
}

function warnOnApprovalWithoutVerification(absDir: string, manifest: AgentManifest, warnings: string[]): void {
  const requiredFor = manifest.verification?.required_for;
  const verified = requiredFor && typeof requiredFor === 'object' && !Array.isArray(requiredFor) ? new Set(Object.keys(requiredFor as Record<string, unknown>)) : new Set<string>();
  for (const [key, value] of Object.entries(manifest.policy ?? {})) {
    if (typeof value !== 'string') continue;
    const file = path.join(absDir, value);
    if (!fs.existsSync(file)) continue;
    let doc: unknown;
    try { doc = yaml.load(fs.readFileSync(file, 'utf-8')); } catch { continue; }
    for (const action of actionsRequiringApproval(doc)) {
      if (!verified.has(action)) warnings.push(`Action class "${action}" in policy.${key} requires explicit approval but has no verification.required_for contract`);
    }
  }
}

function actionsRequiringApproval(doc: unknown): string[] {
  const found: string[] = [];
  function visit(node: unknown, key?: string): void {
    if (!node || typeof node !== 'object') return;
    if (!Array.isArray(node)) {
      const rec = node as Record<string, unknown>;
      if ((rec.default === 'require_explicit_approval' || rec.approval === 'require_explicit_approval') && key) found.push(key);
      for (const [childKey, child] of Object.entries(rec)) visit(child, childKey);
    } else {
      for (const child of node) visit(child);
    }
  }
  visit(doc);
  return [...new Set(found)];
}

function warnOnRulesWithoutPrecedence(absDir: string, warnings: string[]): void {
  const rulesDir = path.join(absDir, 'rules');
  if (!fs.existsSync(rulesDir)) return;
  const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md'));
  if (files.length <= 1) return;
  const anyPrecedence = files.some((file) => /^---[\s\S]*?\nprecedence:/m.test(fs.readFileSync(path.join(rulesDir, file), 'utf-8')));
  if (!anyPrecedence) warnings.push('rules/ contains multiple files but none declare precedence frontmatter');
}

function warnOnSpecMajorMismatch(manifest: AgentManifest, warnings: string[]): void {
  const packagePath = path.join(import.meta.dirname, '..', 'package.json');
  if (!fs.existsSync(packagePath)) return;
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as { version?: string };
  const manifestMajor = Number((manifest.spec_version || '').split('.')[0]);
  const packageMajor = Number((pkg.version || '').split('.')[0]);
  if (Number.isFinite(manifestMajor) && Number.isFinite(packageMajor) && manifestMajor !== packageMajor) {
    warnings.push(`spec_version major ${manifestMajor} differs from package/schema major ${packageMajor}`);
  }
}
