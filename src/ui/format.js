const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let base = new Date(Date.UTC(2026, 10, 24));
export function setToday(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  base = new Date(Date.UTC(y, m - 1, d));
}
const at = (day) => new Date(base.getTime() + day * 86400000);
export function dateLabel(day) {
  if (day == null) return '';
  const d = at(day);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
export function dayName(day) {
  if (day === 0) return 'today';
  if (day === 1) return 'tomorrow';
  const d = at(day);
  return `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
export const mg = (x) => `${x} mg`;
export const firstName = (n) => n.split(' ')[0];
export const COVERAGE = { commercial: 'Commercial plan', employer: 'Self-insured employer', medicare: 'Medicare' };
export const USE = { weight: 'Weight', t2d: 'Type 2 diabetes', cv: 'Heart risk', osa: 'Sleep apnea' };
export const KIND = {
  hold: { label: 'Hold', tone: 'coral' },
  fax: { label: 'Fax prescriber', tone: 'blue' },
  call: { label: 'Call patient', tone: 'amber' },
  none: { label: 'Nothing today', tone: 'pine' },
};
export const PRIORITY = [
  { key: 'now', label: 'Cannot wait', hint: 'Today, or it stops working' },
  { key: 'soon', label: 'This week', hint: 'Each has a last day' },
  { key: 'track', label: 'On track', hint: 'Nothing to do yet' },
];
