import React, { useEffect, useState } from 'react';
import Today from './ui/Today.jsx';
import Insight from './ui/Insight.jsx';
import Plans from './ui/Plans.jsx';
import Pilot from './ui/Pilot.jsx';
import { setToday, dateLabel } from './ui/format.js';
import { TABS } from './ui/deskState.js';
import data from './data/desk.json';

setToday(data.store.today);

const readRoute = () => {
  const [t, q] = window.location.hash.replace(/^#\/?/, '').split('?');
  const tab = t === 'today' ? 'desk' : TABS.some((x) => x.key === t) ? t : 'why';
  return { tab, patient: new URLSearchParams(q || '').get('p') };
};

function Masthead({ tab, store }) {
  return (
    <header className="a-mast">
      <div className="a-mast-in">
        <a className="a-title" href="#/why">GLP-1 Start Desk</a>
        <nav className="a-nav" aria-label="Sections">
          {TABS.map((t) => <a key={t.key} href={`#/${t.key}`} className={tab === t.key ? 'on' : ''} aria-current={tab === t.key ? 'page' : undefined}>{t.label}</a>)}
        </nav>
        <span className="a-dateline">{store.name}, synthetic patients, {dateLabel(0)}, 2026</span>
      </div>
    </header>
  );
}

export default function App() {
  const [{ tab, patient }, setRoute] = useState(readRoute());
  useEffect(() => {
    const on = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (t, p) => { window.location.hash = `/${t}${p ? `?p=${p}` : ''}`; };
  return (
    <div className="app">
      <Masthead tab={tab} store={data.store} />
      <main key={tab}>
        {tab === 'why' && <Insight data={data} go={go} />}
        {tab === 'desk' && <Today data={data} initial={patient} />}
        {tab === 'plans' && <div className="a-carry"><Plans /></div>}
        {tab === 'pilot' && <div className="a-carry"><Pilot /></div>}
      </main>
      <footer className="a-foot">
        <span>Synthetic patients. Dose rules from the FDA labels for Wegovy, Ozempic, Zepbound and Mounjaro. Every dose decision goes to the prescriber.</span>
        <a href="#/pilot">How a pilot would prove it</a>
      </footer>
    </div>
  );
}
