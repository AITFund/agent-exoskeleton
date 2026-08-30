import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface ModelConfig {
  preferred?: string;
  fallback?: string;
  constraints?: {
    temperature?: number;
    max_tokens?: number;
  };
}

export interface SubAgentConfig {
  description: string;
  delegation?: 'auto' | 'manual' | 'disabled';
}

export interface ChannelActivationConfig {
  posture?: 'ambient' | 'direct_only' | 'manual_only' | 'disabled';
  respond_when?: string[];
  ignore?: string[];
}

export interface FormattingConfig {
  bold?: string;
  italic?: string;
  headings?: boolean;
  links?: string | boolean;
  code_blocks?: boolean;
  bullets?: string;
}

export interface AgentManifest {
  spec_version: string;
  name: string;
  version: string;
  description: string;
  model?: ModelConfig;
  skills?: string[];
  tools?: string[];
  agents?: Record<string, SubAgentConfig>;
  communication?: {
    channels?: string[];
    formatting?: Record<string, FormattingConfig>;
    activation?: Record<string, ChannelActivationConfig>;
  };
  policy?: Record<string, string | unknown>;
  connections?: string[];
  ops?: Record<string, string[] | unknown>;
  verification?: Record<string, unknown>;
  memory?: {
    strategy?: 'file-based' | 'database' | 'none';
    auto_save?: boolean;
  };
  runtime?: {
    container?: boolean;
    network?: boolean;
    filesystem?: 'none' | 'read-only' | 'read-write';
    max_turns?: number;
    [key: string]: unknown;
  };
  metadata?: {
    author?: string;
    license?: string;
    repository?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface SkillMetadata {
  name: string;
  description: string;
  version?: string;
  tools?: string[];
  triggers?: string[];
}

export interface Skill {
  metadata: SkillMetadata;
  body: string;
}

export interface KnowledgeEntry {
  path: string;
  description: string;
  always_load: boolean;
}

export interface AgentDefinition {
  manifest: AgentManifest;
  identity: string;
  rules: string[];
  skills: Skill[];
  knowledge: { entries: KnowledgeEntry[]; documents: Record<string, string> };
  memory: string | null;
  subAgents: Record<string, AgentDefinition>;
  basePath: string;
}

function readFileIfExists(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseSkillFrontmatter(content: string): Skill {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    return {
      metadata: { name: 'unknown', description: '' },
      body: content,
    };
  }
  const metadata = yaml.load(fmMatch[1]) as SkillMetadata;
  return { metadata, body: fmMatch[2].trim() };
}

export function loadAgent(agentDir: string): AgentDefinition {
  const absDir = path.resolve(agentDir);

  // Required: agent.yaml
  const manifestPath = path.join(absDir, 'agent.yaml');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing required file: agent.yaml in ${absDir}`);
  }
  const manifest = yaml.load(
    fs.readFileSync(manifestPath, 'utf-8'),
  ) as AgentManifest;

  // Required: IDENTITY.md
  const identityPath = path.join(absDir, 'IDENTITY.md');
  if (!fs.existsSync(identityPath)) {
    throw new Error(`Missing required file: IDENTITY.md in ${absDir}`);
  }
  const identity = fs.readFileSync(identityPath, 'utf-8');

  // Optional: rules/
  const rules: string[] = [];
  const rulesDir = path.join(absDir, 'rules');
  if (fs.existsSync(rulesDir)) {
    const ruleFiles = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.md')).sort();
    // RULES.md first, then alphabetical
    const sorted = ruleFiles.sort((a, b) => {
      if (a === 'RULES.md') return -1;
      if (b === 'RULES.md') return 1;
      return a.localeCompare(b);
    });
    for (const file of sorted) {
      rules.push(fs.readFileSync(path.join(rulesDir, file), 'utf-8'));
    }
  }

  // Optional: skills/
  const skills: Skill[] = [];
  if (manifest.skills) {
    const skillsDir = path.join(absDir, 'skills');
    for (const skillName of manifest.skills) {
      const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
      const content = readFileIfExists(skillPath);
      if (content) {
        skills.push(parseSkillFrontmatter(content));
      }
    }
  }

  // Optional: knowledge/
  const knowledge: AgentDefinition['knowledge'] = { entries: [], documents: {} };
  const knowledgeIndex = path.join(absDir, 'knowledge', 'index.yaml');
  if (fs.existsSync(knowledgeIndex)) {
    const index = yaml.load(fs.readFileSync(knowledgeIndex, 'utf-8')) as {
      documents: KnowledgeEntry[];
    };
    knowledge.entries = index.documents || [];
    for (const entry of knowledge.entries) {
      const docPath = path.join(absDir, 'knowledge', entry.path);
      const content = readFileIfExists(docPath);
      if (content) {
        knowledge.documents[entry.path] = content;
      }
    }
  }

  // Optional: memory/MEMORY.md
  const memory = readFileIfExists(path.join(absDir, 'memory', 'MEMORY.md'));

  // Optional: agents/ (recursive)
  const subAgents: Record<string, AgentDefinition> = {};
  if (manifest.agents) {
    for (const agentName of Object.keys(manifest.agents)) {
      const subDir = path.join(absDir, 'agents', agentName);
      if (fs.existsSync(path.join(subDir, 'agent.yaml'))) {
        subAgents[agentName] = loadAgent(subDir);
      }
    }
  }

  return {
    manifest,
    identity,
    rules,
    skills,
    knowledge,
    memory,
    subAgents,
    basePath: absDir,
  };
}

/** Load only skill metadata (name + description) for lightweight routing. */
export function loadSkillMetadata(agentDir: string): SkillMetadata[] {
  const absDir = path.resolve(agentDir);
  const manifestPath = path.join(absDir, 'agent.yaml');
  if (!fs.existsSync(manifestPath)) return [];

  const manifest = yaml.load(
    fs.readFileSync(manifestPath, 'utf-8'),
  ) as AgentManifest;
  if (!manifest.skills) return [];

  const results: SkillMetadata[] = [];
  const skillsDir = path.join(absDir, 'skills');
  for (const skillName of manifest.skills) {
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
    const content = readFileIfExists(skillPath);
    if (content) {
      const skill = parseSkillFrontmatter(content);
      results.push(skill.metadata);
    }
  }
  return results;
}
