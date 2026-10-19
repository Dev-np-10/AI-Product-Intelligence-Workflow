// Rewrites compiled JS in dist-test so Node ESM can resolve it:
//  1) relative imports without an extension get .js appended
//  2) "@/*" path-alias imports are rewritten to relative paths
// Run after tsc -p tsconfig.test.json.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT_URL = new URL('../dist-test/', import.meta.url);
const ROOT_PATH = ROOT_URL.pathname;

async function walk(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, files);
    } else if (extname(e.name) === '.js') {
      files.push(full);
    }
  }
  return files;
}

function rewriteSpecifier(spec, fromFile) {
  // Handle "@/..." alias -> relative path to dist-test/<rest>
  if (spec.startsWith('@/')) {
    const target = join(ROOT_PATH, spec.slice(2));
    let rel = relative(fromFile.replace(/\/[^/]+$/, ''), target);
    if (!rel.startsWith('.')) rel = './' + rel;
    spec = rel.split(sep).join('/');
  }
  // Append .js if no extension
  if (!extname(spec)) {
    spec = spec + '.js';
  }
  return spec;
}

const RE = /((?:from|import|export[^'"]*?|import\(|require\()\s*['"])([^'"]+)(['"])/g;

async function main() {
  const files = await walk(ROOT_PATH);
  let touched = 0;
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    let changed = false;
    const out = src.replace(RE, (match, pre, spec, post) => {
      if (!spec.startsWith('.') && !spec.startsWith('@/')) return match;
      const rewritten = rewriteSpecifier(spec, f);
      if (rewritten === spec) return match;
      changed = true;
      return `${pre}${rewritten}${post}`;
    });
    if (changed) {
      await writeFile(f, out, 'utf8');
      touched += 1;
    }
  }
  console.log(`fixup-imports: rewrote imports in ${touched} file(s).`);
}

main().catch((err) => {
  console.error('fixup-imports failed:', err);
  process.exit(1);
});
