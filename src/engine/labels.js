// Dose schedules and label rules for the four products the desk covers, from each FDA label.
// Strengths are in mg, given once weekly. Every field carries the label section it came from.
import { cite } from './sources.js';

export const PRODUCTS = {
  wegovy: {
    key: 'wegovy',
    brand: 'Wegovy',
    ingredient: 'semaglutide',
    uses: ['weight', 'cv'],
    // Section 2.2, Table 1: 0.25, 0.5, 1 and 1.7 mg for 4 weeks each, then maintenance from week 17.
    steps: [0.25, 0.5, 1, 1.7, 2.4],
    maintenance: [1.7, 2.4],
    max: 7.2,
    weeksPerStep: 4,
    // Section 2.4: next dose more than 2 days away, give it. Less than 2 days, skip it.
    missedWindowDays: 2,
    // Section 2.4: two or more consecutive missed doses, reinitiate escalation at a lower dosage.
    restartAfterMissed: 2,
    // Section 2.2: if a dose is not tolerated during escalation, consider delaying escalation.
    delayIfNotTolerated: true,
    oralContraceptiveWeeks: 0,
    pregnancy: 'Stop when pregnancy is recognized, and at least 2 months before a planned pregnancy.',
    cite: {
      schedule: cite('wegovy', '2.2'),
      missed: cite('wegovy', '2.4'),
      tolerate: cite('wegovy', '2.2'),
      warnings: cite('wegovy', '5'),
      boxed: cite('wegovy', 'Boxed warning'),
      pregnancy: cite('wegovy', '8.1, 8.3'),
    },
  },
  ozempic: {
    key: 'ozempic',
    brand: 'Ozempic',
    ingredient: 'semaglutide',
    uses: ['t2d'],
    // Section 2.2: 0.25 mg for 4 weeks, then 0.5 mg. Increase after at least 4 weeks per dose. Max 2 mg.
    steps: [0.25, 0.5, 1, 2],
    maintenance: [0.5, 1, 2],
    max: 2,
    weeksPerStep: 4,
    // Section 2.1: within 5 days of the missed dose, give it. After 5 days, skip it.
    missedWindowDays: 5,
    restartAfterMissed: null,
    delayIfNotTolerated: false,
    oralContraceptiveWeeks: 0,
    pregnancy: 'Stop at least 2 months before a planned pregnancy.',
    cite: {
      schedule: cite('ozempic', '2.2'),
      missed: cite('ozempic', '2.1'),
      tolerate: cite('ozempic', '2.2'),
      warnings: cite('ozempic', '5'),
      boxed: cite('ozempic', 'Boxed warning'),
      pregnancy: cite('ozempic', '8.3'),
    },
  },
  zepbound: {
    key: 'zepbound',
    brand: 'Zepbound',
    ingredient: 'tirzepatide',
    uses: ['weight', 'osa'],
    // Sections 2.1 and 2.2: 2.5 mg for 4 weeks (not a maintenance dose), then 5 mg, then 2.5 mg steps
    // after at least 4 weeks each. Maintenance 5, 10 or 15 mg (OSA 10 or 15). Max 15 mg.
    steps: [2.5, 5, 7.5, 10, 12.5, 15],
    maintenance: [5, 10, 15],
    max: 15,
    weeksPerStep: 4,
    // Section 2.3: within 4 days (96 hours), give it. After 4 days, skip it.
    missedWindowDays: 4,
    restartAfterMissed: null,
    // Section 2.2 speaks to maintenance: if not tolerated, consider a lower maintenance dosage.
    delayIfNotTolerated: false,
    lowerMaintenanceIfNotTolerated: true,
    // Highlights and section 17: non-oral contraception or a barrier method for 4 weeks after starting and after each step.
    oralContraceptiveWeeks: 4,
    pregnancy: 'Stop when pregnancy is recognized.',
    cite: {
      schedule: cite('zepbound', '2.1, 2.2'),
      missed: cite('zepbound', '2.3'),
      tolerate: cite('zepbound', '2.2'),
      warnings: cite('zepbound', '5'),
      boxed: cite('zepbound', 'Boxed warning'),
      pregnancy: cite('zepbound', '8.1'),
      contraceptive: cite('zepbound', 'Highlights, 17'),
    },
  },
  mounjaro: {
    key: 'mounjaro',
    brand: 'Mounjaro',
    ingredient: 'tirzepatide',
    uses: ['t2d'],
    // Section 2.1: 2.5 mg weekly, then 2.5 mg steps after at least 4 weeks each if more control is needed. Max 15 mg in adults.
    steps: [2.5, 5, 7.5, 10, 12.5, 15],
    maintenance: [5, 7.5, 10, 12.5, 15],
    max: 15,
    weeksPerStep: 4,
    missedWindowDays: 4,
    restartAfterMissed: null,
    delayIfNotTolerated: false,
    oralContraceptiveWeeks: 4,
    pregnancy: 'Ask the prescriber. The label does not give a stop date.',
    cite: {
      schedule: cite('mounjaro', '2.1'),
      missed: cite('mounjaro', '2.1'),
      tolerate: cite('mounjaro', '2.1'),
      warnings: cite('mounjaro', '5'),
      boxed: cite('mounjaro', 'Boxed warning'),
      pregnancy: cite('mounjaro', '8.1'),
      contraceptive: cite('mounjaro', 'Highlights'),
    },
  },
};

export const USE_LABEL = { weight: 'Weight', t2d: 'Type 2 diabetes', cv: 'Heart risk', osa: 'Sleep apnea' };

// The next strength on the label's ladder, or null at the top or at the prescriber's target.
export function nextStep(product, strength, target) {
  const p = PRODUCTS[product];
  const i = p.steps.indexOf(strength);
  if (i < 0) throw new Error(`${strength} mg is not a ${p.brand} step`);
  if (target != null && strength >= target) return null;
  return p.steps[i + 1] ?? null;
}

// Week of therapy (1-based) on a given day.
export const weekOf = (startDay, day) => Math.floor((day - startDay) / 7) + 1;
