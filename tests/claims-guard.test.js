// No outcome number may be presented as this desk's result in the README, docs or app.
// Quoted studies carry their source. The desk itself has no outcome data until a pilot.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const files = ['README.md', ...readdirSync(join(root, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`), ...readdirSync(join(root, 'src/ui')).map((f) => `src/ui/${f}`), 'src/App.jsx'];
const RESULT_CLAIMS = [
  /desk (keeps|kept|saves|saved|raises|raised|lifts|lifted)\s+\S*\s*\d/i,
  /\d+(\.\d+)?\s*%\s+(more|fewer)\s+(patients|members|starts)/i,
  /(would|will|should)\s+(keep|save)\s+(about\s+)?\d+/i,
  /\d+(\.\d+)?\s+(more\s+)?(patients|members)\s+(reach|reached|kept|on therapy)/i,
  /saves?\s+\$\d/i,
];

describe('no simulated outcome claims', () => {
  it('checks the files it means to check', () => {
    expect(files).toContain('README.md');
    expect(files.length).toBeGreaterThan(6);
  });
  for (const f of files) {
    it(`${f} claims no outcome`, () => {
      const text = readFileSync(join(root, f), 'utf8');
      for (const re of RESULT_CLAIMS) expect(text, String(re)).not.toMatch(re);
    });
  }
  it('every quoted study number in the app names its source', async () => {
    const { WHY_STOP, ANCHORS } = await import('../src/engine/payer.js');
    for (const x of [...WHY_STOP, ...ANCHORS]) expect(x.url, x.text).toMatch(/^https:\/\//);
  });
});
