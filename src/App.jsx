import React, { useEffect, useState } from 'react';
import Today from './ui/Today.jsx';
import Insight from './ui/Insight.jsx';
import Plans from './ui/Plans.jsx';
import Pilot from './ui/Pilot.jsx';
import { BrandMark } from './ui/bits.jsx';
import { setToday, dateLabel } from './ui/format.js';
import data from './data/desk.json';
import { readDirection } from './directions/shared.jsx';
import DirectionA from './directions/a/A.jsx';
import DirectionB from './directions/b/B.jsx';
import DirectionC from './directions/c/C.jsx';

const DIRECTION = readDirection();
const SHELLS = { a: DirectionA, b: DirectionB, c: DirectionC };

setToday(data.store.today);

const TABS = [
  { key: 'why', label: 'The insight', short: 'Insight' },
  { key: 'desk', label: 'Work list', short: 'Work list' },
  { key: 'plans', label: 'For plans', short: 'Plans' },
  { key: 'pilot', label: 'Pilot', short: 'Pilot' },
];

const readRoute = () => {
  const [t, q] = window.location.hash.replace(/^#\/?/, '').split('?');
  const tab = t === 'today' ? 'desk' : TABS.some((x) => x.key === t) ? t : 'why';
  return { tab, patient: new URLSearchParams(q || '').get('p') };
};

export default function App() {
  const [{ tab, patient }, setRoute] = useState(readRoute());
  useEffect(() => {
    const on = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (t, p) => { window.location.hash = `/${t}${p ? `?p=${p}` : ''}`; };
  if (DIRECTION) {
    // A visual direction under review, chosen with ?direction=a, b or c. Same data, same desk logic.
    const Shell = SHELLS[DIRECTION];
    return <Shell data={data} tab={tab} patient={patient} go={go} />;
  }
  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#/why" aria-label="GLP-1 Start Desk, home">
          <BrandMark />
          <span>GLP-1 Start Desk</span>
          <span className="brandsub">synthetic</span>
        </a>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <a key={t.key} href={`#/${t.key}`} className={tab === t.key ? 'tab on' : 'tab'} aria-current={tab === t.key ? 'page' : undefined}><span className="long">{t.label}</span><span className="short">{t.short}</span></a>
          ))}
        </nav>
        <div className="planchip" title="Every patient on this desk is made up">{data.store.name} · synthetic patients · {dateLabel(0)}, 2026</div>
      </header>
      <main key={tab}>
        {tab === 'why' && <Insight data={data} go={go} />}
        {tab === 'desk' && <Today data={data} initial={patient} />}
        {tab === 'plans' && <Plans />}
        {tab === 'pilot' && <Pilot />}
      </main>
      <footer className="foot">
        <span>Synthetic patients. Dose rules from the FDA labels for Wegovy, Ozempic, Zepbound and Mounjaro. Every dose decision goes to the prescriber.</span>
        <a href="#/pilot">How a pilot would prove it</a>
      </footer>
    </div>
  );
}
