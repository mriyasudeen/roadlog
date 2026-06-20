import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Car, Fuel, CalendarDays, PoundSterling, Clock3, Plus, BarChart3, History, Settings, Home, Bell, Download, Trash2 } from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'audi-a4-fuel-entries-v1';
const demoEntries = [
  { id: crypto.randomUUID(), date: '2026-06-02', cost: 68.4, odometer: 54210, style: 'Normal' },
  { id: crypto.randomUUID(), date: '2026-06-16', cost: 72.5, odometer: 54602, style: 'Mostly Town' }
];

function readEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : demoEntries;
  } catch {
    return demoEntries;
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function fmtMoney(n) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(n || 0));
}

function fmtDate(date) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(date));
}

function calcStats(entries) {
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last = sorted[0];
  const now = new Date();
  const thisMonth = entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + Number(e.cost), 0);

  const asc = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const gaps = [];
  for (let i = 1; i < asc.length; i++) gaps.push(Math.max(1, daysBetween(asc[i - 1].date, asc[i].date)));
  const avgGap = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 14;
  const daysSinceLast = last ? Math.max(0, daysBetween(last.date, now)) : 0;
  const daysLeft = Math.max(0, avgGap - daysSinceLast);
  const nextRefill = last ? new Date(new Date(last.date).getTime() + avgGap * 86400000) : now;
  const avgFill = entries.length ? entries.reduce((s, e) => s + Number(e.cost), 0) / entries.length : 0;
  return { sorted, last, thisMonth, avgGap, daysSinceLast, daysLeft, nextRefill, avgFill };
}

function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function Dashboard({ stats, setTab }) {
  return <main className="screen">
    <div className="hero">
      <div>
        <p className="eyebrow">Audi companion</p>
        <h1>Audi A4</h1>
        <p className="muted">2018 fuel tracker</p>
      </div>
      <div className="rings"><Car size={34} /></div>
    </div>

    <Card className="main-meter">
      <div className="meter-top"><Fuel size={22} /><span>Days Until Empty</span></div>
      <div className="big-number">{stats.daysLeft}</div>
      <p className="muted">Based on your average {stats.avgGap} day refill interval</p>
      <div className="progress"><span style={{ width: `${Math.min(100, (stats.daysLeft / Math.max(1, stats.avgGap)) * 100)}%` }} /></div>
    </Card>

    <div className="grid-two">
      <Card><CalendarDays /><p>Next refill</p><strong>{fmtDate(stats.nextRefill)}</strong></Card>
      <Card><PoundSterling /><p>This month</p><strong>{fmtMoney(stats.thisMonth)}</strong></Card>
    </div>

    <Card className="last-card">
      <div><p className="muted">Last fill-up</p><h2>{stats.last ? fmtMoney(stats.last.cost) : 'No entries'}</h2></div>
      <div className="pill"><Clock3 size={16} /> {stats.last ? `${stats.daysSinceLast} days ago` : 'Add first'}</div>
    </Card>

    <button className="primary" onClick={() => setTab('add')}><Plus size={20} /> Add Fuel</button>
  </main>;
}

function AddFuel({ entries, setEntries, setTab }) {
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [style, setStyle] = useState('Normal');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function submit(e) {
    e.preventDefault();
    if (!cost || Number(cost) <= 0) return;
    const next = [{ id: crypto.randomUUID(), date, cost: Number(cost), odometer: odometer ? Number(odometer) : null, style }, ...entries];
    setEntries(next);
    saveEntries(next);
    setTab('home');
  }

  return <main className="screen">
    <h1>Add Fuel</h1>
    <p className="muted">Fast entry for your next fill-up.</p>
    <form onSubmit={submit} className="form-card">
      <label>Fuel cost (£)<input inputMode="decimal" placeholder="72.50" value={cost} onChange={e => setCost(e.target.value)} /></label>
      <label>Odometer optional<input inputMode="numeric" placeholder="54821" value={odometer} onChange={e => setOdometer(e.target.value)} /></label>
      <label>Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      <div className="segmented">{['Normal','Motorway','Mostly Town'].map(x => <button type="button" className={style === x ? 'active' : ''} onClick={() => setStyle(x)} key={x}>{x}</button>)}</div>
      <button className="primary" type="submit">Save Fill-Up</button>
    </form>
  </main>;
}

function HistoryScreen({ entries }) {
  const sorted = [...entries].sort((a,b) => new Date(b.date)-new Date(a.date));
  return <main className="screen"><h1>History</h1><p className="muted">Your recent fuel entries.</p>
    <div className="list">{sorted.map(e => <Card className="row" key={e.id}><div><strong>{fmtDate(e.date)}</strong><p className="muted">{e.style}{e.odometer ? ` • ${e.odometer} mi` : ''}</p></div><h2>{fmtMoney(e.cost)}</h2></Card>)}</div>
  </main>;
}

function StatsScreen({ entries, stats }) {
  const annual = stats.avgGap ? (365 / stats.avgGap) * stats.avgFill : 0;
  return <main className="screen"><h1>Stats</h1><p className="muted">Simple insights from your fill-ups.</p>
    <div className="grid-two">
      <Card><BarChart3 /><p>Avg fill-up</p><strong>{fmtMoney(stats.avgFill)}</strong></Card>
      <Card><CalendarDays /><p>Avg interval</p><strong>{stats.avgGap} days</strong></Card>
    </div>
    <Card className="chart-card"><p className="muted">Estimated annual fuel spend</p><h2>{fmtMoney(annual)}</h2><div className="bars">{entries.slice(0,6).reverse().map((e,i)=><span key={e.id} style={{height:`${30 + Math.min(80, e.cost)}px`}} />)}</div></Card>
  </main>;
}

function SettingsScreen({ entries, setEntries }) {
  function clearAll() { if (confirm('Clear all fuel entries?')) { setEntries([]); saveEntries([]); } }
  function exportData() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'audi-fuel-entries.json'; a.click();
  }
  return <main className="screen"><h1>Settings</h1><p className="muted">Data is stored locally in this browser.</p>
    <Card className="settings-row"><Bell /><div><strong>Reminder logic</strong><p className="muted">Next refill is predicted from your average interval.</p></div></Card>
    <button className="secondary" onClick={exportData}><Download size={18}/> Export backup</button>
    <button className="danger" onClick={clearAll}><Trash2 size={18}/> Clear entries</button>
  </main>;
}

function App() {
  const [tab, setTab] = useState('home');
  const [entries, setEntries] = useState(readEntries);
  const stats = useMemo(() => calcStats(entries), [entries]);
  const nav = [
    ['home', Home, 'Home'], ['stats', BarChart3, 'Stats'], ['add', Plus, 'Add'], ['history', History, 'History'], ['settings', Settings, 'Settings']
  ];
  return <div className="app-shell">
    {tab === 'home' && <Dashboard stats={stats} setTab={setTab}/>} {tab === 'add' && <AddFuel entries={entries} setEntries={setEntries} setTab={setTab}/>} {tab === 'history' && <HistoryScreen entries={entries}/>} {tab === 'stats' && <StatsScreen entries={entries} stats={stats}/>} {tab === 'settings' && <SettingsScreen entries={entries} setEntries={setEntries}/>} 
    <nav className="bottom-nav">{nav.map(([id, Icon, label]) => <button key={id} onClick={()=>setTab(id)} className={tab===id?'active':''}><Icon size={21}/><span>{label}</span></button>)}</nav>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
