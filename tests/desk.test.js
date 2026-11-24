import { describe, it, expect } from 'vitest';
import { analyze, coverage, todayList, mustToday, FAX_LEAD_DAYS } from '../src/engine/desk.js';
import { buildPatients } from '../src/engine/patients.js';

const base = (o) => ({ id: 'T-1', name: 'Test Patient', age: 50, product: 'wegovy', uses: ['weight'], coverage: 'commercial', target: 2.4, startDay: -26, fills: [{ day: -26, strength: 0.25, ds: 28 }], rx: [{ strength: 0.5, fillsLeft: 1 }], pa: null, card: null, stock: {}, meds: [], reports: [], ...o });

describe('coverage', () => {
  it('carries an early refill forward instead of double counting', () => {
    const c = coverage([{ day: 0, strength: 0.25, ds: 28 }, { day: 20, strength: 0.5, ds: 28 }], 0, 50);
    expect(c.through).toBe(55);
    expect(c.covered).toBe(50);
    expect(c.gapDays).toBe(0);
  });
  it('counts a gap after the supply ends', () => {
    const c = coverage([{ day: 0, strength: 0.25, ds: 28 }], 0, 40);
    expect(c.through).toBe(27);
    expect(c.covered).toBe(28);
    expect(c.elapsed).toBe(40);
    expect(c.gapDays).toBe(12);
  });
  it('stops counting at week 12', () => {
    const c = coverage([{ day: 0, strength: 1, ds: 120 }], 0, 200);
    expect(c.elapsed).toBe(84);
    expect(c.covered).toBe(84);
  });
});

describe('rules', () => {
  it('asks for the next strength when the step is due and none is on file', () => {
    const a = analyze(base({ rx: [{ strength: 0.25, fillsLeft: 0 }] }), 0);
    expect(a.action).toMatchObject({ kind: 'fax', type: 'step' });
    expect(a.action.by).toBe(0);
  });
  it('never steps up before 4 weeks on the current dose, even after an early refill', () => {
    const a = analyze(base({ startDay: -10, fills: [{ day: -10, strength: 0.25, ds: 28 }, { day: -2, strength: 0.25, ds: 28 }] }), 0);
    expect(a.stepDueDay).toBeGreaterThanOrEqual(-10 + 28);
  });
  it('holds on a red flag, ahead of everything else', () => {
    for (const key of ['abdominal-pain-severe', 'ruq-pain', 'dehydration', 'thyroid-history', 'pregnant']) {
      const a = analyze(base({ rx: [], reports: [{ day: -1, effects: [{ key, level: 'severe' }] }] }), 0);
      expect(a.action.kind, key).toBe('hold');
      expect(a.action.cite.url).toMatch(/dailymed/);
    }
  });
  it('asks to slow down on moderate stomach effects before a step', () => {
    const a = analyze(base({ reports: [{ day: -2, effects: [{ key: 'nausea', level: 'moderate' }] }] }), 0);
    expect(a.action).toMatchObject({ kind: 'fax', type: 'slow' });
    expect(a.action.why).toMatch(/delaying/);
  });
  it('mild effects continue with self-care, no fax', () => {
    const a = analyze(base({ reports: [{ day: -2, effects: [{ key: 'nausea', level: 'mild' }] }] }), 0);
    expect(a.tolerability.call).toBe('continue');
    expect(a.say.join(' ')).toMatch(/smaller meals/);
  });
  it('low sugars matter only with insulin or a sulfonylurea', () => {
    const r = [{ day: -1, effects: [{ key: 'low-sugar', level: 'moderate' }] }];
    expect(analyze(base({ product: 'mounjaro', uses: ['t2d'], target: 10, fills: [{ day: -26, strength: 2.5, ds: 28 }], rx: [{ strength: 5, fillsLeft: 1 }], meds: ['insulin'], reports: r }), 0).action.type).toBe('other-drug');
    expect(analyze(base({ product: 'mounjaro', uses: ['t2d'], target: 10, fills: [{ day: -26, strength: 2.5, ds: 28 }], rx: [{ strength: 5, fillsLeft: 1 }], meds: ['metformin'], reports: r }), 0).action.type).not.toBe('other-drug');
  });
  it('Wegovy after 2 missed doses: the label says restart lower', () => {
    const a = analyze(base({ startDay: -50, fills: [{ day: -50, strength: 0.25, ds: 28 }] }), 0);
    expect(a.missedDoses).toBe(4);
    expect(a.action.type).toBe('restart');
    expect(a.action.why).toMatch(/restart the escalation at a lower dose/);
  });
  it('tirzepatide after 2 missed doses: the label is silent, so the prescriber decides', () => {
    const a = analyze(base({ product: 'zepbound', target: 10, startDay: -50, fills: [{ day: -50, strength: 2.5, ds: 28 }], rx: [{ strength: 5, fillsLeft: 1 }] }), 0);
    expect(a.action.type).toBe('restart');
    expect(a.action.why).toMatch(/no restart rule/);
  });
  it('counts every weekly dose that fell due with no supply', () => {
    // Supply runs through day -1: nothing missed yet.
    expect(analyze(base({ startDay: -28, fills: [{ day: -28, strength: 0.25, ds: 28 }] }), 0).missedDoses).toBe(0);
    // Ran out 1 to 7 days ago: one dose missed, a call.
    const b = analyze(base({ startDay: -34, fills: [{ day: -34, strength: 0.25, ds: 28 }], rx: [{ strength: 0.5, fillsLeft: 1 }] }), 0);
    expect(b.missedDoses).toBe(1);
    expect(b.action).toMatchObject({ kind: 'call', type: 'refill' });
    // Ran out 8 days ago: a second dose day has passed.
    expect(analyze(base({ startDay: -36, fills: [{ day: -36, strength: 0.25, ds: 28 }] }), 0).missedDoses).toBe(2);
  });
  it('at the lowest maintenance dose, asks to reassess instead of a lower dose', () => {
    const a = analyze(base({ product: 'zepbound', target: 5, startDay: -60, fills: [{ day: -60, strength: 2.5, ds: 28 }, { day: -32, strength: 5, ds: 28 }, { day: -4, strength: 5, ds: 28 }], rx: [{ strength: 5, fillsLeft: 2 }], reports: [{ day: -2, effects: [{ key: 'diarrhea', level: 'moderate' }] }] }), 0);
    expect(a.action.type).toBe('reassess');
    expect(a.action.ask).not.toMatch(/lower maintenance/);
  });
  it('the low-sugar fax names only the drug the patient takes', () => {
    const a = analyze(base({ product: 'mounjaro', uses: ['t2d'], target: 10, fills: [{ day: -26, strength: 2.5, ds: 28 }], rx: [{ strength: 5, fillsLeft: 1 }], meds: ['insulin'], reports: [{ day: -1, effects: [{ key: 'low-sugar', level: 'moderate' }] }] }), 0);
    expect(a.action.ask).toMatch(/insulin/);
    expect(a.action.ask).not.toMatch(/sulfonylurea/);
  });
  it('tirzepatide with the pill: says to use backup for 4 weeks around a step', () => {
    const a = analyze(base({ product: 'zepbound', target: 10, fills: [{ day: -26, strength: 2.5, ds: 28 }], rx: [{ strength: 5, fillsLeft: 1 }], meds: ['oral-contraceptive'] }), 0);
    expect(a.say.join(' ')).toMatch(/4 weeks after starting and after each new dose/);
    const w = analyze(base({ meds: ['oral-contraceptive'] }), 0);
    expect(w.say.join(' ')).not.toMatch(/Birth control/);
  });
  it('Medicare with weight as the only use flags the Part D exclusion and the Bridge', () => {
    const a = analyze(base({ coverage: 'medicare' }), 0);
    expect(a.blockers.map((b) => b.key)).toContain('bridge');
    const cv = analyze(base({ coverage: 'medicare', uses: ['weight', 'cv'] }), 0);
    expect(cv.blockers.map((b) => b.key)).not.toContain('bridge');
  });
  it('a step fax leaves the prescriber time to answer', () => {
    const a = analyze(base({ startDay: -20, fills: [{ day: -20, strength: 0.25, ds: 28 }], rx: [] }), 0);
    expect(a.action.by).toBe(a.stepDueDay - FAX_LEAD_DAYS);
  });
});

describe('the demo patients', () => {
  const ps = buildPatients();
  const as = ps.map((p) => ({ ...analyze(p, 0), tag: p.tag }));
  it('every case lands on the action it was built for', () => {
    const want = { 'step-no-rx': 'step', 'step-no-rx-later': 'step', slow: 'slow', reassess: 'reassess', hold: 'hold', 'other-drug': 'other-drug', restart: 'restart', pa: 'pa', card: 'cost', stock: 'stock', bridge: 'bridge', late: 'refill', ends: 'refill', 'checkin-step': 'checkin', 'checkin-oc': 'checkin', 'checkin-new': 'checkin', procedure: 'procedure', ok: 'none' };
    for (const a of as) expect(a.action.type || a.action.kind, `${a.id} ${a.tag}`).toBe(want[a.tag]);
  });
  it('every action names its rule, and clinical rules link to a label or CMS', () => {
    for (const a of as) {
      expect(a.action.cite, a.id).toBeTruthy();
      if (['hold', 'step', 'slow', 'lower', 'restart', 'other-drug', 'refill', 'procedure', 'bridge'].includes(a.action.type || a.action.kind)) expect(a.action.cite.url, a.id).toMatch(/^https:\/\//);
    }
  });
  it('every fax asks the prescriber, it never changes a dose itself', () => {
    for (const a of as.filter((x) => x.action.kind === 'fax')) expect(a.action.ask, a.id).toMatch(/Please/);
  });
  it('pregnancy and contraceptive cases are women', () => {
    for (const p of ps) {
      if (p.meds.includes('oral-contraceptive') || p.reports.some((r) => r.effects.some((e) => e.key === 'pregnant'))) expect(p.sex, p.name).toBe('F');
    }
  });
  it('the cannot-wait group is today only, and holds come first', () => {
    const list = todayList(as, 0);
    expect(list[0].action.kind).toBe('hold');
    const must = list.filter((a) => mustToday(a, 0));
    expect(must.length).toBeGreaterThan(0);
    expect(must.length).toBeLessThan(list.length);
    expect(list.slice(0, must.length).every((a) => mustToday(a, 0))).toBe(true);
  });
});

describe('breaks for the opening chart', async () => {
  const { breakOf } = await import('../src/engine/desk.js');
  const ps = buildPatients();
  it('every patient with an action has a dated break, on-track patients have none', () => {
    for (const p of ps) {
      const a = analyze(p, 0);
      const b = breakOf(a, 0);
      if (a.action.kind === 'none' || a.action.type === 'checkin' || a.action.type === 'procedure') expect(b, p.id).toBeNull();
      else { expect(b, `${p.id} ${a.action.type}`).not.toBeNull(); expect(b.day).toBeGreaterThanOrEqual(0); }
    }
  });
});
