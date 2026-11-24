// Public text must not name a local machine, disk or private working folder,
// and prose for readers uses no semicolons or em dashes.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildPatients } from '../src/engine/patients.js';
import { analyze } from '../src/engine/desk.js';

const root = new URL('..', import.meta.url).pathname;
const BANNED = [/\/Users\//, /\/Volumes\//, /HubData/, /\/private\/tmp/, /~\/dev/, /MFW_UMBRELLA_ROOT/, /OPERATOR_ECOSYSTEM_ROOT/, /localhost/, /127\.0\.0\.1/];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', '.vercel', '.claude'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(md|json|html|jsx|js)$/.test(name) && !name.startsWith('package-lock')) out.push(p);
  }
  return out;
}

describe('public text guard', () => {
  const files = walk(root).filter((f) => !f.includes('/tests/'));
  it('sees the files it is meant to check', () => {
    expect(files.some((f) => f.endsWith('README.md'))).toBe(true);
    expect(files.length).toBeGreaterThan(10);
  });
  for (const f of files) {
    it(`${f.slice(root.length)} has no local paths and no em dashes`, () => {
      const text = readFileSync(f, 'utf8');
      for (const re of BANNED) expect(text, String(re)).not.toMatch(re);
      expect(text).not.toMatch(/—/);
    });
  }
  it('docs prose has no semicolons', () => {
    for (const f of files.filter((x) => x.endsWith('.md'))) {
      const prose = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
      expect(prose, f).not.toMatch(/;/);
    }
  });
  it('every line the desk writes (faxes, reasons, blockers, titles) has no semicolons', () => {
    const strings = [];
    const walkObj = (o) => { if (typeof o === 'string') strings.push(o); else if (o && typeof o === 'object') Object.values(o).forEach(walkObj); };
    for (const p of buildPatients()) walkObj(analyze(p, 0));
    expect(strings.length).toBeGreaterThan(100);
    for (const s of strings) expect(s).not.toMatch(/;|—/);
  });
});
