// Synthetic patients. Every name, prescriber, fill and report here is made up.
// Days count from the desk's "today" (day 0). A start on day -26 began 26 days ago.
// Each case is built to put one real counter situation on the desk, so a reviewer sees every rule fire.
import { mulberry32, pick } from './rng.js';

const FEMALE = ['Dana', 'Priya', 'Alicia', 'Grace', 'Keisha', 'Megan', 'Rita', 'Tanya', 'Wendy', 'Bea', 'Diane', 'Fran', 'Hana', 'Jada', 'Lena', 'Nia', 'Pam', 'Rosa'];
const MALE = ['Marcus', 'Tom', 'Hector', 'Luis', 'Omar', 'Sam', 'Victor', 'Yusuf', 'Carl', 'Eli', 'Gus', 'Ivan', 'Kurt', 'Mo', 'Owen', 'Ray'];
const LAST = ['Archer', 'Baptiste', 'Calloway', 'Dimas', 'Easley', 'Farrow', 'Gaines', 'Hollis', 'Iqbal', 'Jeter', 'Kwan', 'Lorde', 'Mabry', 'Nunez', 'Odum', 'Pace', 'Quan', 'Rios', 'Sledge', 'Tandy', 'Ulloa', 'Voss', 'Wilder', 'Yeager'];
const PRESCRIBERS = [
  { id: 'D-201', name: 'Dr. Lauren Ostrowski', practice: 'Cypress Primary Care' },
  { id: 'D-202', name: 'Dr. Ade Okonkwo', practice: 'Lakeshore Endocrinology' },
  { id: 'D-203', name: 'Jamie Reyes, NP', practice: 'Northgate Medical Group' },
  { id: 'D-204', name: 'Dr. Harold Benz', practice: 'Harbor Internal Medicine' },
  { id: 'D-205', name: 'Dr. Sun-Hee Park', practice: 'Bayview Weight Health' },
  { id: 'D-206', name: 'Chris Malloy, PA', practice: 'Oak Hollow Clinic' },
];

// Fills every 28 days up the given strengths, with optional extra delay before each fill.
function ladder(startDay, strengths, delays = []) {
  let day = startDay;
  return strengths.map((s, i) => {
    day += i === 0 ? 0 : 28 + (delays[i] || 0);
    return { day, strength: s, ds: 28 };
  });
}

const CASES = [
  // Step due, no prescription for the next strength: the week 4 cliff.
  { tag: 'step-no-rx', product: 'wegovy', uses: ['weight'], coverage: 'commercial', target: 2.4, fills: ladder(-26, [0.25]), rx: [{ strength: 0.25, fillsLeft: 0 }], pa: { strengths: [0.25, 0.5, 1, 1.7, 2.4], through: 200 } },
  { tag: 'step-no-rx', product: 'zepbound', uses: ['weight', 'osa'], coverage: 'employer', target: 10, fills: ladder(-54, [2.5, 5]), rx: [{ strength: 5, fillsLeft: 0 }], reports: [{ day: -20, effects: [{ key: 'nausea', level: 'mild' }] }] },
  { tag: 'step-no-rx', product: 'mounjaro', uses: ['t2d'], coverage: 'medicare', target: 7.5, fills: ladder(-53, [2.5, 5]), rx: [{ strength: 5, fillsLeft: 1 }], meds: ['metformin'] },
  { tag: 'step-no-rx-later', product: 'ozempic', uses: ['t2d'], coverage: 'medicare', target: 1, fills: ladder(-21, [0.25]), rx: [{ strength: 0.25, fillsLeft: 0 }], meds: ['metformin'] },
  // Moderate stomach effects right before a step: slow down.
  { tag: 'slow', product: 'mounjaro', uses: ['t2d'], coverage: 'commercial', target: 10, fills: ladder(-25, [2.5]), rx: [{ strength: 5, fillsLeft: 3 }], reports: [{ day: -2, effects: [{ key: 'nausea', level: 'moderate' }, { key: 'constipation', level: 'mild' }] }], meds: ['metformin'] },
  { tag: 'slow', product: 'wegovy', uses: ['weight'], coverage: 'employer', target: 2.4, fills: ladder(-63, [0.25, 0.5, 1]), rx: [{ strength: 1.7, fillsLeft: 1 }], reports: [{ day: -1, effects: [{ key: 'vomiting', level: 'moderate' }, { key: 'nausea', level: 'moderate' }] }] },
  { tag: 'reassess', product: 'zepbound', uses: ['weight'], coverage: 'commercial', target: 5, fills: ladder(-78, [2.5, 5, 5]), rx: [{ strength: 5, fillsLeft: 2 }], reports: [{ day: -3, effects: [{ key: 'diarrhea', level: 'moderate' }] }] },
  // Red flags: hold the next dose and get the prescriber today.
  { tag: 'hold', product: 'ozempic', uses: ['t2d'], coverage: 'medicare', target: 1, fills: ladder(-40, [0.25, 0.5]), rx: [{ strength: 0.5, fillsLeft: 2 }], reports: [{ day: 0, effects: [{ key: 'abdominal-pain-severe', level: 'severe' }, { key: 'vomiting', level: 'moderate' }] }], meds: ['metformin'] },
  { tag: 'hold', product: 'zepbound', uses: ['weight'], coverage: 'employer', target: 10, fills: ladder(-33, [2.5, 5]), rx: [{ strength: 5, fillsLeft: 2 }], reports: [{ day: -1, effects: [{ key: 'dehydration', level: 'severe' }, { key: 'diarrhea', level: 'severe' }] }] },
  // Low sugars on insulin: the other drug needs to come down.
  { tag: 'other-drug', product: 'mounjaro', uses: ['t2d'], coverage: 'medicare', target: 10, fills: ladder(-36, [2.5, 5]), rx: [{ strength: 7.5, fillsLeft: 2 }], reports: [{ day: -2, effects: [{ key: 'low-sugar', level: 'moderate' }] }], meds: ['insulin', 'metformin'] },
  // Two or more weeks without supply.
  { tag: 'restart', product: 'wegovy', uses: ['weight'], coverage: 'commercial', target: 2.4, fills: ladder(-70, [0.25, 0.5]), rx: [{ strength: 1, fillsLeft: 2 }], reports: [{ day: -30, effects: [{ key: 'nausea', level: 'moderate' }] }] },
  { tag: 'restart', product: 'zepbound', uses: ['weight'], coverage: 'employer', target: 10, fills: ladder(-71, [2.5, 5]), rx: [{ strength: 7.5, fillsLeft: 2 }] },
  // Coverage and stock blockers.
  { tag: 'pa', product: 'zepbound', uses: ['weight'], coverage: 'commercial', target: 10, fills: ladder(-23, [2.5]), rx: [{ strength: 5, fillsLeft: 3 }], pa: { strengths: [2.5], through: 60 } },
  { tag: 'card', product: 'zepbound', uses: ['weight'], coverage: 'commercial', target: 10, fills: ladder(-50, [2.5, 5]), rx: [{ strength: 7.5, fillsLeft: 3 }], card: { through: 3, copayWithout: 550 } },
  { tag: 'stock', product: 'wegovy', uses: ['weight'], coverage: 'employer', target: 2.4, fills: ladder(-80, [0.25, 0.5, 1]), rx: [{ strength: 1.7, fillsLeft: 3 }], stock: { 1.7: 'out' }, reports: [{ day: -12, effects: [{ key: 'nausea', level: 'mild' }] }] },
  { tag: 'bridge', product: 'wegovy', uses: ['weight'], coverage: 'medicare', target: 2.4, fills: ladder(-20, [0.25]), rx: [{ strength: 0.5, fillsLeft: 3 }] },
  // Refill timing.
  { tag: 'late', product: 'ozempic', uses: ['t2d'], coverage: 'medicare', target: 0.5, fills: ladder(-60, [0.25, 0.5]), rx: [{ strength: 0.5, fillsLeft: 4 }], meds: ['metformin'] },
  { tag: 'ends', product: 'mounjaro', uses: ['t2d'], coverage: 'commercial', target: 5, fills: ladder(-54, [2.5, 5]), rx: [{ strength: 5, fillsLeft: 4 }] },
  // Check-ins.
  { tag: 'checkin-step', product: 'wegovy', uses: ['weight'], coverage: 'employer', target: 2.4, fills: ladder(-31, [0.25, 0.5]), rx: [{ strength: 1, fillsLeft: 1 }], reports: [{ day: -14, effects: [] }] },
  { tag: 'checkin-oc', product: 'zepbound', uses: ['weight'], coverage: 'commercial', target: 10, fills: ladder(-30, [2.5, 5]), rx: [{ strength: 7.5, fillsLeft: 1 }], meds: ['oral-contraceptive'], reports: [{ day: -15, effects: [{ key: 'nausea', level: 'mild' }] }] },
  { tag: 'checkin-new', product: 'zepbound', uses: ['weight'], coverage: 'employer', target: 10, fills: ladder(-3, [2.5]), rx: [{ strength: 5, fillsLeft: 1 }] },
  { tag: 'procedure', product: 'wegovy', uses: ['weight', 'cv'], coverage: 'medicare', target: 2.4, fills: ladder(-44, [0.25, 0.5]), rx: [{ strength: 1, fillsLeft: 2 }], reports: [{ day: -1, effects: [{ key: 'procedure', level: 'mild' }, { key: 'nausea', level: 'mild' }] }] },
  // More money and paperwork breaks, so the cohort leans the way published reasons for stopping do.
  { tag: 'pa', product: 'mounjaro', uses: ['t2d'], coverage: 'commercial', target: 10, fills: ladder(-51, [2.5, 5]), rx: [{ strength: 7.5, fillsLeft: 2 }], pa: { strengths: [2.5, 5, 7.5, 10], through: 3 }, meds: ['metformin'] },
  { tag: 'card', product: 'wegovy', uses: ['weight'], coverage: 'commercial', target: 2.4, fills: ladder(-52, [0.25, 0.5]), rx: [{ strength: 1, fillsLeft: 2 }], card: { through: 2, copayWithout: 499 } },
  { tag: 'step-no-rx', product: 'ozempic', uses: ['t2d'], coverage: 'commercial', target: 1, fills: ladder(-54, [0.25, 0.5]), rx: [{ strength: 0.5, fillsLeft: 0 }], meds: ['metformin'] },
  { tag: 'stock', product: 'zepbound', uses: ['weight'], coverage: 'employer', target: 10, fills: ladder(-23, [2.5]), rx: [{ strength: 5, fillsLeft: 2 }], stock: { 5: 'out' } },
  // On track: nothing today.
  { tag: 'ok', product: 'wegovy', uses: ['weight', 'cv'], coverage: 'medicare', target: 2.4, fills: ladder(-50, [0.25, 0.5]), rx: [{ strength: 1, fillsLeft: 2 }], reports: [{ day: -6, effects: [{ key: 'nausea', level: 'mild' }] }] },
  { tag: 'ok', product: 'mounjaro', uses: ['t2d'], coverage: 'commercial', target: 7.5, fills: ladder(-40, [2.5, 5]), rx: [{ strength: 7.5, fillsLeft: 2 }], meds: ['metformin'] },
  { tag: 'ok', product: 'zepbound', uses: ['weight'], coverage: 'employer', target: 10, fills: ladder(-66, [2.5, 5, 7.5]), rx: [{ strength: 10, fillsLeft: 2 }], reports: [{ day: -9, effects: [] }] },
  { tag: 'ok', product: 'ozempic', uses: ['t2d'], coverage: 'commercial', target: 1, fills: ladder(-45, [0.25, 0.5]), rx: [{ strength: 1, fillsLeft: 2 }], reports: [{ day: -8, effects: [{ key: 'reflux', level: 'mild' }] }] },
  { tag: 'ok', product: 'wegovy', uses: ['weight'], coverage: 'commercial', target: 2.4, fills: ladder(-10, [0.25]), rx: [{ strength: 0.5, fillsLeft: 1 }], reports: [{ day: -6, effects: [{ key: 'nausea', level: 'mild' }] }] },
  { tag: 'ok', product: 'zepbound', uses: ['weight', 'osa'], coverage: 'employer', target: 10, fills: ladder(-80, [2.5, 5, 7.5]), rx: [{ strength: 10, fillsLeft: 2 }] },
];

export function buildPatients(seed = 7) {
  const rng = mulberry32(seed);
  const used = new Set();
  let f = 0;
  let m = 0;
  return CASES.map((c, i) => {
    const fem = c.meds?.includes('oral-contraceptive') || c.reports?.some((r) => r.effects.some((e) => e.key === 'pregnant')) || i % 2 === 0;
    let name;
    do name = `${fem ? FEMALE[f++ % FEMALE.length] : MALE[m++ % MALE.length]} ${pick(rng, LAST)}`; while (used.has(name));
    used.add(name);
    const young = c.meds?.includes('oral-contraceptive') || c.reports?.some((r) => r.effects.some((e) => e.key === 'pregnant'));
    const age = c.coverage === 'medicare' ? 66 + Math.floor(rng() * 12) : young ? 28 + Math.floor(rng() * 10) : 34 + Math.floor(rng() * 26);
    return {
      id: `G-${String(301 + i)}`,
      name,
      age,
      sex: fem ? 'F' : 'M',
      tag: c.tag,
      product: c.product,
      uses: c.uses,
      coverage: c.coverage,
      target: c.target,
      startDay: c.fills[0].day,
      fills: c.fills,
      rx: c.rx,
      pa: c.pa || null,
      card: c.card || null,
      stock: c.stock || {},
      meds: c.meds || [],
      reports: c.reports || [],
      prescriber: PRESCRIBERS[Math.floor(rng() * PRESCRIBERS.length)],
    };
  });
}

export { PRESCRIBERS };
