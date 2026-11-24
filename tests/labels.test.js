// Dose schedules and missed-dose rules against each FDA label (see src/engine/sources.js).
import { describe, it, expect } from 'vitest';
import { PRODUCTS, nextStep } from '../src/engine/labels.js';

describe('label schedules', () => {
  it('Wegovy: 0.25, 0.5, 1, 1.7 for 4 weeks each, then 2.4 (section 2.2, Table 1)', () => {
    expect(PRODUCTS.wegovy.steps).toEqual([0.25, 0.5, 1, 1.7, 2.4]);
    expect(PRODUCTS.wegovy.maintenance).toEqual([1.7, 2.4]);
  });
  it('Ozempic: 0.25 for 4 weeks, then 0.5, 1, 2 mg max (section 2.2)', () => {
    expect(PRODUCTS.ozempic.steps).toEqual([0.25, 0.5, 1, 2]);
    expect(PRODUCTS.ozempic.max).toBe(2);
  });
  it('tirzepatide: 2.5 start, 2.5 mg steps, 15 mg max, 2.5 is never maintenance', () => {
    for (const k of ['zepbound', 'mounjaro']) {
      expect(PRODUCTS[k].steps).toEqual([2.5, 5, 7.5, 10, 12.5, 15]);
      expect(PRODUCTS[k].maintenance).not.toContain(2.5);
      expect(PRODUCTS[k].max).toBe(15);
    }
  });
  it('every step lasts at least 4 weeks', () => {
    for (const p of Object.values(PRODUCTS)) expect(p.weeksPerStep).toBe(4);
  });
  it('missed-dose windows: Wegovy 2 days, Ozempic 5, tirzepatide 4', () => {
    expect(PRODUCTS.wegovy.missedWindowDays).toBe(2);
    expect(PRODUCTS.ozempic.missedWindowDays).toBe(5);
    expect(PRODUCTS.zepbound.missedWindowDays).toBe(4);
    expect(PRODUCTS.mounjaro.missedWindowDays).toBe(4);
  });
  it('only the Wegovy label has a restart rule after 2 missed doses', () => {
    expect(PRODUCTS.wegovy.restartAfterMissed).toBe(2);
    for (const k of ['ozempic', 'zepbound', 'mounjaro']) expect(PRODUCTS[k].restartAfterMissed).toBeNull();
  });
  it('only tirzepatide carries the 4-week oral contraceptive advice', () => {
    expect(PRODUCTS.zepbound.oralContraceptiveWeeks).toBe(4);
    expect(PRODUCTS.mounjaro.oralContraceptiveWeeks).toBe(4);
    expect(PRODUCTS.wegovy.oralContraceptiveWeeks).toBe(0);
    expect(PRODUCTS.ozempic.oralContraceptiveWeeks).toBe(0);
  });
  it('next step stops at the prescriber target', () => {
    expect(nextStep('zepbound', 5, 10)).toBe(7.5);
    expect(nextStep('zepbound', 10, 10)).toBeNull();
    expect(nextStep('wegovy', 1.7, 2.4)).toBe(2.4);
    expect(() => nextStep('wegovy', 0.75, 2.4)).toThrow();
  });
  it('every product cites its label for schedule, missed dose and warnings', () => {
    for (const p of Object.values(PRODUCTS)) {
      for (const k of ['schedule', 'missed', 'warnings', 'boxed', 'pregnancy']) {
        expect(p.cite[k].url, `${p.brand} ${k}`).toMatch(/^https:\/\/dailymed\.nlm\.nih\.gov\//);
        expect(p.cite[k].section).toBeTruthy();
      }
    }
  });
});

describe('missed-dose wording', () => {
  it('Wegovy counts from the next dose, the others from the missed one', () => {
    expect(PRODUCTS.wegovy.missedRule).toMatch(/next one is more than 2 days away/);
    expect(PRODUCTS.ozempic.missedRule).toMatch(/within 5 days/);
    expect(PRODUCTS.zepbound.missedRule).toMatch(/within 4 days/);
    expect(PRODUCTS.mounjaro.missedRule).toMatch(/within 4 days/);
  });
});
