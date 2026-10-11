import { useEffect, useMemo, useState } from "react";
import AnalysisPanel from "./components/AnalysisPanel.jsx";
import MetricCard from "./components/MetricCard.jsx";
import Sparkline from "./components/Sparkline.jsx";

const api = async (url, options) => {
  const response = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The request could not be completed.");
  return body;
};

export default function App() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [tab, setTab] = useState("dashboard"); const [filter, setFilter] = useState("all"); const [analysis, setAnalysis] = useState(null); const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "Cooling Fan 8", line: "Assembly A", health: 64, temperature: 77, vibration: 5.8, pressure: 128 });
  const [formBusy, setFormBusy] = useState(false); const [formError, setFormError] = useState("");

  const load = async () => { setLoading(true); setError(""); try { setData(await api("/api/dashboard")); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(""), 3000); return () => clearTimeout(timer); } }, [toast]);
  const machines = useMemo(() => data?.analyses.filter((a) => filter === "all" || a.risk.toLowerCase() === filter) || [], [data, filter]);
  const inspect = async (id) => { try { setAnalysis(await api(`/api/machines/${id}/analysis`)); } catch (e) { setToast(e.message); } };
  const submitReading = async (event) => { event.preventDefault(); setFormBusy(true); setFormError(""); try { setAnalysis(await api("/api/analyze", { method: "POST", body: JSON.stringify(form) })); } catch (e) { setFormError(e.message); } finally { setFormBusy(false); } };
  const createOrder = async (machine) => { try { await api("/api/work-orders", { method: "POST", body: JSON.stringify({ machineId: machine.id, title: `Inspect ${machine.name} based on AI-assisted condition alert`, priority: machine.status === "critical" ? "high" : "medium" }) }); setToast("Work order created and queued for human review."); await load(); } catch (e) { setToast(e.message); } };
  const feedback = async (rating) => { try { await api("/api/feedback", { method: "POST", body: JSON.stringify({ rating, machineId: analysis?.machine.id }) }); setToast("Thank you. Your feedback was saved."); } catch (e) { setToast(`Feedback was not saved: ${e.message}`); } };
  const updateOrder = async (id, status) => { try { await api(`/api/work-orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); setToast("Work-order status updated."); await load(); } catch (e) { setToast(`Status was not updated: ${e.message}`); } };

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark">P</div><div><strong>PlantPulse</strong><span>AI Maintenance</span></div></div><nav aria-label="Primary navigation">
      {[['dashboard','▦','Overview'],['equipment','◉','Equipment'],['analyze','✦','Analyze reading'],['orders','☑','Work orders']].map(([id,icon,label]) => <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}><span aria-hidden="true">{icon}</span>{label}</button>)}
    </nav><div className="sidebar-note"><span className="live-dot"/>Classroom demonstration<div>Human-reviewed maintenance decisions</div></div></aside>
    <main><header><div><p className="eyebrow">NORTHSTAR MANUFACTURING · PLANT 01</p><h1>{tab === "dashboard" ? "Operations overview" : tab === "equipment" ? "Equipment health" : tab === "analyze" ? "Analyze sensor reading" : "Maintenance work orders"}</h1></div><div className="header-actions"><button className="refresh" onClick={load} disabled={loading}>↻ Refresh</button><div className="avatar">RP</div></div></header>
      {toast && <div className="toast" role="status">{toast}</div>}
      {error && <div className="error-banner" role="alert"><strong>Unable to load dashboard.</strong><span>{error}</span><button onClick={load}>Try again</button></div>}
      {loading && !data ? <div className="loading-grid" role="status" aria-label="Loading equipment dashboard">{Array.from({length:6}).map((_,i)=><div key={i} aria-hidden="true"/>)}</div> : data && <>
        {tab === "dashboard" && <Dashboard data={data} inspect={inspect} createOrder={createOrder} />}
        {tab === "equipment" && <Equipment analyses={machines} filter={filter} setFilter={setFilter} inspect={inspect} />}
        {tab === "analyze" && <AnalyzeForm form={form} setForm={setForm} submit={submitReading} busy={formBusy} error={formError} />}
        {tab === "orders" && <Orders orders={data.workOrders} machines={data.machines} onUpdate={updateOrder} />}
      </>}
    </main><AnalysisPanel analysis={analysis} onClose={() => setAnalysis(null)} onFeedback={feedback}/>
  </div>;
}

function Dashboard({ data, inspect, createOrder }) {
  const priority = [...data.analyses].sort((a,b)=>b.riskScore-a.riskScore);
  return <div className="content"><section className="metrics"><MetricCard label="Monitored assets" value={data.summary.total} note="Across 4 production areas" icon="▦"/><MetricCard label="Healthy" value={data.summary.healthy} note="Operating normally" tone="green" icon="✓"/><MetricCard label="Needs attention" value={data.summary.warnings} note="Plan next inspection" tone="amber" icon="!"/><MetricCard label="Critical risks" value={data.summary.critical} note="Human review required" tone="red" icon="⚠"/></section>
    <section className="two-column"><article className="panel"><div className="panel-title"><div><h2>Priority maintenance queue</h2><p>Ranked using sensor thresholds and health trends</p></div><span className="updated">Updated now</span></div>
      <div className="machine-list">{priority.slice(0,4).map((item)=><div className="machine-row" key={item.machine.id}><div className={`status-ring ${item.risk.toLowerCase()}`}>{item.riskScore}</div><div className="machine-info"><strong>{item.machine.name}</strong><span>{item.machine.id} · {item.machine.line}</span></div><Sparkline values={item.machine.history} color={item.risk==='High'?'#ff6b78':item.risk==='Medium'?'#f3b85b':'#5ce1a2'}/><div className={`risk-text ${item.risk.toLowerCase()}`}>{item.risk}</div><button className="text-button" onClick={()=>inspect(item.machine.id)}>Review →</button></div>)}</div>
    </article><article className="panel insight"><div className="ai-orb">✦</div><p className="eyebrow">PLANTPULSE INSIGHT</p><h2>{priority[0].machine.name} needs attention</h2><p>{priority[0].reasons[0]}. Review the evidence before changing operations.</p><button className="primary" onClick={()=>inspect(priority[0].machine.id)}>View analysis</button><button className="secondary" onClick={()=>createOrder(priority[0].machine)}>Create work order</button><small>Recommendations do not automatically stop equipment.</small></article></section>
    <section className="panel"><div className="panel-title"><div><h2>Fleet health snapshot</h2><p>Latest simulated sensor readings</p></div></div><div className="fleet-grid">{data.analyses.map((item)=><button key={item.machine.id} className="fleet-card" onClick={()=>inspect(item.machine.id)}><div><strong>{item.machine.name}</strong><span>{item.machine.line}</span></div><Sparkline values={item.machine.history}/><b>{item.machine.health}%</b></button>)}</div></section>
  </div>;
}

function Equipment({ analyses, filter, setFilter, inspect }) { return <div className="content"><div className="filters">{[['all','All assets'],['high','High risk'],['medium','Medium risk'],['low','Low risk']].map(([id,label])=><button key={id} className={filter===id?'selected':''} onClick={()=>setFilter(id)}>{label}</button>)}</div><section className="equipment-grid">{analyses.map((item)=><article className="equipment-card" key={item.machine.id}><div className="equipment-top"><div className={`machine-icon ${item.risk.toLowerCase()}`}>⚙</div><div className={`risk-badge ${item.risk.toLowerCase()}`}>{item.risk} risk</div></div><h2>{item.machine.name}</h2><p>{item.machine.id} · {item.machine.line}</p><Sparkline values={item.machine.history}/><div className="reading-row"><span>Health <b>{item.machine.health}%</b></span><span>Temp <b>{item.machine.temperature}°C</b></span><span>Vibration <b>{item.machine.vibration}</b></span></div><button className="primary wide" onClick={()=>inspect(item.machine.id)}>Open AI analysis</button></article>)}</section></div>; }

function AnalyzeForm({ form, setForm, submit, busy, error }) { const update=(e)=>setForm({...form,[e.target.name]:e.target.value}); return <div className="content narrow"><section className="panel form-panel"><div className="form-intro"><div className="ai-orb" aria-hidden="true">✦</div><div><h2>Manual condition check</h2><p>Enter a current sensor snapshot. PlantPulse will explain the risk indicators without making an automatic shutdown decision.</p></div></div>{error&&<div className="form-error" role="alert">{error}</div>}<form onSubmit={submit}><label>Equipment name<input name="name" value={form.name} onChange={update} maxLength="60" required/></label><label>Production area<input name="line" value={form.line} onChange={update} maxLength="60"/></label><div className="form-grid"><label>Health score (0–100)<input name="health" type="number" min="0" max="100" value={form.health} onChange={update} required/></label><label>Temperature (°C)<input name="temperature" type="number" min="0" max="250" step="0.1" value={form.temperature} onChange={update} required/></label><label>Vibration (mm/s)<input name="vibration" type="number" min="0" max="50" step="0.1" value={form.vibration} onChange={update} required/></label><label>Pressure (psi)<input name="pressure" type="number" min="0" max="500" step="0.1" value={form.pressure} onChange={update} required/></label></div><button className="primary submit" disabled={busy}>{busy?<><span className="spinner" aria-hidden="true"/>Analyzing readings…</>:"Analyze condition"}</button></form><p className="privacy-note">Demonstration data only. Do not enter confidential production information.</p></section></div>; }

function Orders({ orders, machines, onUpdate }) { const name=(id)=>machines.find(m=>m.id===id)?.name||id; return <div className="content"><section className="panel"><div className="panel-title"><div><h2>Human-reviewed work queue</h2><p>AI suggestions become actionable only after a person creates or updates an order.</p></div></div><div className="orders-table"><div className="order header"><span>ID</span><span>Equipment</span><span>Description</span><span>Priority</span><span>Status</span></div>{orders.map(order=><div className="order" key={order.id}><b>{order.id}</b><span>{name(order.machineId)}</span><span>{order.title}</span><span className={`priority ${order.priority}`}>{order.priority}</span><select value={order.status} onChange={(e)=>onUpdate(order.id,e.target.value)} aria-label={`Status for ${order.id}`}>{['Open','Scheduled','In Progress','Completed'].map(s=><option key={s}>{s}</option>)}</select></div>)}</div></section></div>; }
