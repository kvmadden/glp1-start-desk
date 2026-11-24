import React, { useEffect, useState } from 'react';
import Today from './ui/Today.jsx';
import WhyStop from './ui/WhyStop.jsx';
import Plans from './ui/Plans.jsx';
import Pilot from './ui/Pilot.jsx';
import { setToday, dateLabel } from './ui/format.js';

const TABS = [
  { key: 'today', label: 'Today', short: 'Today' },
  { key: 'why', label: 'Why they stop', short: 'Why' },
  { key: 'plans', label: 'For plans', short: 'Plans' },
  { key: 'pilot', label: 'Pilot', short: 'Pilot' },
];

const readTab = () => window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'today';

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState(readTab());
  const [staffing, setStaffing] = useState('full');
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/desk.json`).then((r) => r.json()).then((d) => { setToday(d.store.today); setData(d); });
    const on = () => setTab(readTab());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (t) => { window.location.hash = `/${t}`; window.scrollTo(0, 0); };
  if (!data) return <div className="loading">Opening the desk</div>;
  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#/today" aria-label="GLP-1 Start Desk home">
          <img src={`${import.meta.env.BASE_URL}pen.svg`} alt="" width="28" height="28" />
          <span>GLP-1 Start Desk</span>
          <span className="brandsub">synthetic data</span>
        </a>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <a key={t.key} href={`#/${t.key}`} className={tab === t.key ? 'tab on' : 'tab'} aria-current={tab === t.key ? 'page' : undefined}><span className="long">{t.label}</span><span className="short">{t.short}</span></a>
          ))}
        </nav>
        <div className="planchip" title="Every patient on this desk is made up">{data.store.name} · synthetic · today {dateLabel(0)}, 2026</div>
      </header>
      <main>
        {tab === 'today' && <Today data={data} staffing={staffing} setStaffing={setStaffing} />}
        {tab === 'why' && <WhyStop data={data} go={go} />}
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
