export default function MetricCard({ label, value, note, tone = "green", icon }) {
  return <article className={`metric-card ${tone}`}><div className="metric-icon" aria-hidden="true">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>{note}</span></div></article>;
}
