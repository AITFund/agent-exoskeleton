import fs from 'fs';
import path from 'path';

const OPS_DIRS = ['policy', 'connections', 'ops', 'verification'];
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

export function readOperatingFiles(basePath: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  for (const dir of OPS_DIRS) {
    const abs = path.join(basePath, dir);
    for (const file of walk(abs)) {
      const rel = path.relative(basePath, file).replace(/\\/g, '/');
      files.push({ path: rel, content: fs.readFileSync(file, 'utf-8') });
    }
  }
  return files;
}
