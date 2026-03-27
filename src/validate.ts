import fs from 'fs';
import path from 'path';
import _Ajv from 'ajv';
import _addFormats from 'ajv-formats';

const Ajv = _Ajv as unknown as typeof _Ajv.default;
const addFormats = _addFormats as unknown as typeof _addFormats.default;
import yaml from 'js-yaml';

import type { AgentManifest } from './loader.js';

const SCHEMA_PATH = path.join(
  import.meta.dirname,
  '..',
  'spec',
  'schemas',
  'agent.schema.json',
);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validate(agentDir: string): ValidationResult {
  const absDir = path.resolve(agentDir);
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required files exist
  const manifestPath = path.join(absDir, 'agent.yaml');
  if (!fs.existsSync(manifestPath)) {
    errors.push('Missing required file: agent.yaml');
    return { valid: false, errors, warnings };
  }

  const identityPath = path.join(absDir, 'IDENTITY.md');
  if (!fs.existsSync(identityPath)) {
    errors.push('Missing required file: IDENTITY.md');
  }

  // Parse and validate agent.yaml against schema
  let manifest: AgentManifest;
  try {
    manifest = yaml.load(fs.readFileSync(manifestPath, 'utf-8')) as AgentManifest;
  } catch (e) {
    errors.push(`Invalid YAML in agent.yaml: ${(e as Error).message}`);
    return { valid: false, errors, warnings };
  }

  // Schema validation
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(manifest)) {
    for (const err of validateSchema.errors || []) {
      errors.push(`agent.yaml${err.instancePath}: ${err.message}`);
    }
  }

  // Check referenced skills exist
  if (manifest.skills) {
    for (const skill of manifest.skills) {
      const skillPath = path.join(absDir, 'skills', skill, 'SKILL.md');
      if (!fs.existsSync(skillPath)) {
        errors.push(`Skill "${skill}" declared in agent.yaml but skills/${skill}/SKILL.md not found`);
      }
    }
  }

  // Check referenced sub-agents exist
  if (manifest.agents) {
    for (const agentName of Object.keys(manifest.agents)) {
      const subDir = path.join(absDir, 'agents', agentName, 'agent.yaml');
      if (!fs.existsSync(subDir)) {
        warnings.push(`Sub-agent "${agentName}" declared but agents/${agentName}/agent.yaml not found`);
      }
    }
  }

  // Check IDENTITY.md size
  if (fs.existsSync(identityPath)) {
    const lines = fs.readFileSync(identityPath, 'utf-8').split('\n').length;
    if (lines > 500) {
      warnings.push(`IDENTITY.md is ${lines} lines — recommended max is 500`);
    }
  }

  // Check knowledge index references
  const knowledgeIndex = path.join(absDir, 'knowledge', 'index.yaml');
  if (fs.existsSync(knowledgeIndex)) {
    try {
      const index = yaml.load(fs.readFileSync(knowledgeIndex, 'utf-8')) as {
        documents?: { path: string }[];
      };
      for (const doc of index.documents || []) {
        const docPath = path.join(absDir, 'knowledge', doc.path);
        if (!fs.existsSync(docPath)) {
          errors.push(`Knowledge document "${doc.path}" referenced in index but not found`);
        }
      }
    } catch {
      errors.push('Invalid YAML in knowledge/index.yaml');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
