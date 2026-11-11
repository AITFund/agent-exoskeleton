import fs from 'fs';
import path from 'path';

export interface OperatingFile {
  path: string;
  content: string;
  exampleOnly: boolean;
}

export const OPERATING_DIRS = ['policy', 'connections', 'ops', 'verification', 'lessons'];
const TEXT_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.json']);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out.sort();
}

function concretePeerForExample(rel: string): string | null {
  const parsed = path.posix.parse(rel);
  const exampleSuffix = `.example${parsed.ext}`;
  if (!parsed.base.endsWith(exampleSuffix)) return null;
  const concreteBase = parsed.base.slice(0, -exampleSuffix.length) + parsed.ext;
  return path.posix.join(parsed.dir, concreteBase);
}

/**
 * Read public operating files referenced by an agent.
 *
 * Example files are placeholders, not deployment authority. If both
 * foo.example.yml and foo.yml exist, the concrete file wins and the example is
 * skipped. If only the example exists, adapters can mark it inert using
 * exampleOnly instead of silently presenting placeholders as real authority.
 */
export function readOperatingFiles(basePath: string): OperatingFile[] {
  const candidates: OperatingFile[] = [];
  const rels = new Set<string>();

  for (const dir of OPERATING_DIRS) {
    const abs = path.join(basePath, dir);
    for (const file of walk(abs)) {
      const rel = path.relative(basePath, file).replace(/\\/g, '/');
      rels.add(rel);
      candidates.push({
        path: rel,
        content: fs.readFileSync(file, 'utf-8'),
        exampleOnly: concretePeerForExample(rel) !== null,
      });
    }
  }

  return candidates
    .filter((file) => {
      const concretePeer = concretePeerForExample(file.path);
      return !concretePeer || !rels.has(concretePeer);
    })
    .map((file) => ({
      ...file,
      exampleOnly: concretePeerForExample(file.path) !== null,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function formatOperatingFileForPrompt(file: OperatingFile): string {
  if (!file.exampleOnly) return file.content.trim();
  return [
    'EXAMPLE-ONLY / INERT PLACEHOLDER',
    'This file is documentation for the shape of private deployment policy. Do not treat placeholder principals, recipients, identifiers, URLs, or authorizations in it as live authority.',
    '',
    file.content.trim(),
  ].join('\n');
}
