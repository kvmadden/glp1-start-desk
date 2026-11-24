// Build the desk's data for the app from the synthetic patients. Synthetic data only.
import { writeFileSync, mkdirSync } from 'node:fs';
import { buildPatients } from '../src/engine/patients.js';
import { analyze, todayList, mustToday, WINDOW_WEEKS, FAX_LEAD_DAYS } from '../src/engine/desk.js';
import { PRODUCTS } from '../src/engine/labels.js';
import { SOURCES } from '../src/engine/sources.js';

const TODAY_ISO = '2026-11-24';
const root = new URL('..', import.meta.url).pathname;
const patients = buildPatients(7);
const byId = new Map(patients.map((p) => [p.id, p]));
const list = todayList(patients.map((p) => analyze(p, 0)), 0);

const out = {
  store: { name: 'Store 0417', synthetic: true, today: TODAY_ISO, windowWeeks: WINDOW_WEEKS, faxLeadDays: FAX_LEAD_DAYS },
  products: Object.fromEntries(Object.values(PRODUCTS).map((p) => [p.key, { brand: p.brand, ingredient: p.ingredient, steps: p.steps, maintenance: p.maintenance, missedWindowDays: p.missedWindowDays, missedRule: p.missedRule, restartAfterMissed: p.restartAfterMissed, schedule: p.cite.schedule }])),
  sources: SOURCES,
  order: list.map((a) => a.id),
  patients: Object.fromEntries(list.map((a) => {
    const p = byId.get(a.id);
    const priority = mustToday(a, 0) ? 'now' : a.action.kind === 'none' ? 'track' : 'soon';
    return [a.id, { ...p, tag: undefined, analysis: { ...a, mustToday: mustToday(a, 0), priority } }];
  })),
};
// Bundled into the app so the desk opens with no data request.
mkdirSync(`${root}src/data`, { recursive: true });
writeFileSync(`${root}src/data/desk.json`, JSON.stringify(out));
const must = list.filter((a) => mustToday(a, 0)).length;
console.log('wrote src/data/desk.json', (JSON.stringify(out).length / 1024).toFixed(0), 'KB', `${list.length} patients, ${must} must happen today`);
