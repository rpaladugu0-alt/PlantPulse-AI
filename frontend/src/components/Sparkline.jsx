export default function Sparkline({ values, color = "#5ce1a2" }) {
  const max = Math.max(...values); const min = Math.min(...values); const span = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${32 - ((value - min) / span) * 26}`).join(" ");
  return <svg className="spark" viewBox="0 0 100 36" role="img" aria-label={`Health trend from ${values[0]} to ${values.at(-1)}`}><polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
