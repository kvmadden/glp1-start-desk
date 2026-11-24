// Every rule the desk applies points at one of these. Labels were read on DailyMed on 2026-11-24.
export const SOURCES = {
  wegovy: {
    title: 'Wegovy (semaglutide) prescribing information, revised 6/2026',
    url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ee06186f-2aa3-4990-a760-757579d8f77b',
  },
  ozempic: {
    title: 'Ozempic (semaglutide) prescribing information, revised 5/2026',
    url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=adec4fd2-6858-4c99-91d4-531f5f2a2d79',
  },
  zepbound: {
    title: 'Zepbound (tirzepatide) prescribing information, revised 11/2026',
    url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=487cd7e7-434c-4925-99fa-aa80b1cc776b',
  },
  mounjaro: {
    title: 'Mounjaro (tirzepatide) prescribing information, revised 11/2026',
    url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=d2d7da5d-ad07-4228-955f-cf7e355c8cc0',
  },
  bridge: {
    title: 'CMS, Medicare GLP-1 Bridge (page modified 7/13/2026)',
    url: 'https://www.cms.gov/medicare/coverage/prescription-drug-coverage/medicare-glp-1-bridge',
  },
  partdExclusion: {
    title: 'Social Security Act 1860D-2(e)(2) and 1927(d)(2)(A): Part D excludes drugs when used for weight loss',
    url: 'https://www.ssa.gov/OP_Home/ssact/title19/1927.htm',
  },
  practice: {
    title: 'Pharmacist practice, not a label rule. Shown so a reviewer can disagree with it.',
    url: null,
  },
};

export function cite(id, section) {
  const s = SOURCES[id];
  if (!s) throw new Error(`unknown source ${id}`);
  return { id, section: section || null, title: s.title, url: s.url };
}
