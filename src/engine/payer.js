// Public price and evidence anchors for the payer view. Each was read in its primary source on
// 2026-11-22 (research note 06). No outcome number from an assumed rate appears here.
export const ANCHORS = [
  { key: 'cvs-quote', value: '$138', unit: 'per utilizer per month', text: 'CVS Weight Loss Program quote to the North Carolina State Health Plan, 12 months alongside GLP-1 use', source: 'NC State Health Plan Board of Trustees deck, Jan 25, 2024', url: 'https://www.shpnc.gov/media/3391/download' },
  { key: 'broker', value: '$65 to $100', unit: 'per employee per month', text: 'Broker benchmark for employer weight programs. $150 or more per participant when the vendor also prescribes', source: 'CNBC quoting Marsh, Oct 27, 2026', url: 'https://www.cnbc.com/2026/10/27/glp1-drug-coverage-weight-loss-options.html' },
  { key: 'enreach', value: 'Fee paid', unit: 'amount not public', text: 'Evernorth EnReachRx pays participating retail pharmacies a professional service fee for GLP-1 dose and side-effect support', source: 'Evernorth, May 2, 2025', url: 'https://www.evernorth.com/articles/new-evernorth-enreachrx-model-expands-its-suite-glp-1-solutions-works-improve-patient' },
  { key: 'free', value: '$0', unit: 'to the patient today', text: 'CVS offers pharmacist GLP-1 support at no additional cost in about 9,000 stores. The question is who pays for it', source: 'CVS Health, Aug 5, 2026', url: 'https://www.cvshealth.com/news/company-news/cvs-health-enhances-its-direct-to-consumer-weight-management-offerings.html' },
];

export const DRUG_COST = [
  { key: 'semaglutide', label: 'Semaglutide', netPerYear: 6829 },
  { key: 'tirzepatide', label: 'Tirzepatide', netPerYear: 7973 },
];
export const DRUG_COST_SOURCE = { source: 'PHTI, Employer Approaches to GLP-1 Coverage, Dec 2025 (estimated net cost per user per year)', url: 'https://phti.org/wp-content/uploads/sites/3/2025/12/PHTI-Employer-Approaches-to-GLP-1-Coverage-Market-Trend-Report.pdf' };

export const WHY_STOP = [
  { value: 'More than 30%', text: 'of new starts stopped within 4 weeks, while the dose was still going up. Most did not reach 12 weeks', source: 'Blue Health Intelligence issue brief, May 2024, commercial claims', url: 'https://www.bcbs.com/sites/default/files/BHI_Issue_Brief_GLP1_Trends.pdf' },
  { value: '47.6%', text: 'of stops in one clinic chart review were financial (denial, coupon end, cost). Side effects 14.6%, shortage 11.8%', source: 'Gasoyan et al., Obesity, via Cleveland Clinic, Mar 2026', url: 'https://consultqd.clevelandclinic.org/cost-side-effects-top-reasons-for-quitting-glp-1s-for-obesity' },
  { value: 'No offset', text: 'in medical spend at 3 years, even in adherent members. Total cost of care stayed $4,490 higher in year 3', source: 'Prime Therapeutics 3-year cost study, Apr 2026', url: 'https://www.primetherapeutics.com/documents/d/primetherapeutics/pt_glp-1-obesity-treatment-3-year-cost-offset-study-with-non-glp1-pb-trends' },
];

// Arithmetic only: what a fee costs against the drug, and how many drug-months it equals.
export function breakEven({ feePerMonth, months, netPerYear }) {
  const program = feePerMonth * months;
  const drugMonth = netPerYear / 12;
  return { program, drugMonth, drugMonthsEquivalent: program / drugMonth, shareOfDrug: program / (drugMonth * months) };
}
