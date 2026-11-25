// The copy and the sourced figures the screens share: why people stop, who sees each break, and
// what to say on each kind of call.
import { dateLabel, dayName, firstName } from './format.js';

// Reasons for stopping, from one clinic's chart review of semaglutide and tirzepatide stops.
export const REASONS = [
  { label: 'Money: denial, coupon ended, cost', pct: 47.6, kind: 'money' },
  { label: 'Shortage', pct: 11.8, kind: 'supply' },
  { label: 'Side effects', pct: 14.6, kind: 'clinical' },
  { label: 'Unknown', pct: 11.1, kind: 'quiet' },
  { label: 'Other', pct: 10.8, kind: 'quiet' },
];
export const REASONS_SOURCE = { text: 'Money and shortage together: 59.4%. Gasoyan et al., Obesity, 2026, a chart review of 288 people who stopped at one health system, via Cleveland Clinic', url: 'https://consultqd.clevelandclinic.org/cost-side-effects-top-reasons-for-quitting-glp-1s-for-obesity' };

// Who can see each break before the patient stops. Kevin's read of how the information flows today.
export const SEES = {
  rx: ['maybe', 'no', 'yes'],
  pa: ['maybe', 'yes', 'yes'],
  cost: ['no', 'no', 'yes'],
  stock: ['no', 'no', 'yes'],
  effects: ['maybe', 'no', 'yes'],
};
export const SEES_NOTE = {
  rx: ['Only if they track the schedule', '', 'The file has no Rx for the next strength'],
  pa: ['After a denial notice', 'It issued the approval', 'The claim rejects at the counter'],
  cost: ['', 'A manufacturer card is outside the plan', 'The card adjudicates at the register'],
  stock: ['', '', 'The shelf and the order'],
  effects: ['If the patient calls', '', 'At every step-up pickup'],
};
export const WHO = ['Prescriber', 'Plan or PBM', 'Pharmacy'];

// What to say on each kind of call. The desk's own `say` lines are added after these.
export function script(p, a, prod) {
  const n = firstName(p.name);
  const t = a.action.type;
  if (a.action.kind === 'hold') {
    return [
      `${n}, please do not take your next ${prod.brand} dose until your prescriber tells you to.`,
      a.action.care,
      `I am calling ${p.prescriber.name} now and will call you back today.`,
    ];
  }
  if (t === 'other-drug') {
    return [`${n}, I am asking your prescriber whether your ${p.meds.includes('insulin') ? 'insulin' : 'diabetes pill'} dose should come down now that ${prod.brand} is working.`, 'Until you hear back, check your sugar if you feel shaky, sweaty or confused, and treat a low the way your care team showed you.'];
  }
  if (t === 'reassess') {
    return [`${n}, I am asking your prescriber what to do about the side effects on this dose.`, 'Until they answer, keep sipping fluids, eat small meals, and call me if you cannot keep anything down.'];
  }
  if (t === 'refill') {
    return a.missedDoses === 1
      ? [`Your last box ran out ${a.coverage.gapDays} days ago. Your ${a.current}\u00a0mg is ready.`, `The ${prod.brand} rule for a missed dose: ${prod.missedRule.charAt(0).toLowerCase() + prod.missedRule.slice(1)}`, 'What got in the way this time?']
      : [`Your ${a.current}\u00a0mg runs out ${dayName(a.nextFillDay)}. Want me to fill it today so you do not miss a week?`];
  }
  if (t === 'cost') {
    return [`Your savings card ends before your next fill, so the next box could cost $${p.card.copayWithout}.`, 'Do you want me to check whether the card renews, or ask your prescriber about an option your plan covers at a lower cost?', 'If cost will stop you, tell me now. Stopping in the middle of a step is harder to restart than a plan made with your prescriber.'];
  }
  if (t === 'stock') {
    return [`Your next step, ${a.next || a.current}\u00a0mg, is out at this store. I have ordered it.`, `It should be here before your supply ends ${dayName(a.nextFillDay)}. If it is not, I will call and we will find it at a nearby store.`];
  }
  if (t === 'bridge') {
    return ['Medicare drug plans do not cover this medicine when weight is the only reason it is used.', 'The Medicare GLP-1 Bridge may cover it for $50 a month through December 2027. Let me check whether you qualify before your next fill.'];
  }
  if (t === 'procedure') {
    return ['You mentioned a procedure coming up.', 'Please tell the surgeon and the anesthesia team you take this medicine. It slows how fast your stomach empties, which matters under sedation.', 'They will tell you whether to change anything before the procedure.'];
  }
  if (t === 'checkin') {
    return a.week <= 2
      ? [`How was your first ${a.current}\u00a0mg dose, ${n}?`, 'Any nausea, vomiting, belly pain, or trouble keeping fluids down?', `Your next step is ${a.next}\u00a0mg around ${dateLabel(a.stepDueDay)}. I will make sure the prescription is here first.`]
      : [`How is the new ${a.current}\u00a0mg dose going?`, 'Nausea right after a step is common. Is it mild, or is it stopping you from eating or drinking?', 'If it is more than mild, I can ask your prescriber about staying on this dose longer before the next step.'];
  }
  return [];
}
