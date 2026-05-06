/* global React */
const { useMemo } = React;

// ---------- NetWorthArea ----------
// Stacked area: assets (top) and liabilities (bottom-ish, mirrored)
function NetWorthArea({ height = 240 }) {
  const W = 1000, H = height;
  // synthetic data — descending step at end mirrors reference screenshot
  const assets = [6.6,6.6,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.5,6.4,6.0,5.9,5.8,5.5,5.5,5.5];
  const liab   = [3.2,3.2,3.1,3.1,3.1,3.1,3.0,3.0,3.0,3.0,2.9,2.9,2.9,2.9,2.9,2.9,2.8,2.8,2.8,2.8,2.7,2.7,2.7,2.7,2.6,2.4,2.4,2.4,2.3,2.2,2.2];
  const max = 7;
  const xs = (i) => (i / (assets.length - 1)) * W;
  const ys = (v) => H - 24 - (v / max) * (H - 48);

  const areaPath = (vals) => {
    let d = `M 0 ${H} `;
    vals.forEach((v, i) => { d += `L ${xs(i)} ${ys(v)} `; });
    d += `L ${W} ${H} Z`;
    return d;
  };
  const linePath = (vals) => vals.map((v, i) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ga" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5a7a4e" stopOpacity="0.32" />
          <stop offset="1" stopColor="#5a7a4e" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="gb" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#b8615a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#b8615a" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1="0" x2={W} y1={H - 24 - t * (H - 48)} y2={H - 24 - t * (H - 48)}
          stroke="rgba(26,31,23,0.06)" strokeWidth="1" />
      ))}
      <path d={areaPath(assets)} fill="url(#ga)" />
      <path d={linePath(assets)} stroke="#5a7a4e" strokeWidth="1.5" fill="none" />
      <path d={areaPath(liab)} fill="url(#gb)" />
      <path d={linePath(liab)} stroke="#b8615a" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

// ---------- IncomeExpenseBars ----------
function IncomeExpenseBars({ height = 220 }) {
  const W = 1000, H = height;
  const days = 30;
  // mostly small + one big spike near the end (matches reference)
  const incomes  = Array.from({ length: days }, (_, i) => i === 26 ? 1.85 : Math.random() * 0.05);
  const expenses = Array.from({ length: days }, (_, i) => i === 28 ? 0.6 : Math.random() * 0.08);
  const max = 2;
  const bw = (W - 40) / days * 0.35;
  const x = (i) => 20 + (i / days) * (W - 40);
  const y = (v) => H - 24 - (v / max) * (H - 48);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1="0" x2={W} y1={H - 24 - t * (H - 48)} y2={H - 24 - t * (H - 48)}
          stroke="rgba(26,31,23,0.06)" strokeWidth="1" />
      ))}
      {incomes.map((v, i) => (
        <rect key={`i${i}`} x={x(i) - bw - 1} y={y(v)} width={bw} height={H - 24 - y(v)} fill="#5a7a4e" rx="1.5" />
      ))}
      {expenses.map((v, i) => (
        <rect key={`e${i}`} x={x(i) + 1} y={y(v)} width={bw} height={H - 24 - y(v)} fill="#b8615a" rx="1.5" />
      ))}
    </svg>
  );
}

// ---------- CategoryDonut ----------
function CategoryDonut({ data, size = 200 }) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const r = size / 2 - 14, cx = size / 2, cy = size / 2;
  let acc = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const a = (d.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(acc);
    const y1 = cy + r * Math.sin(acc);
    const x2 = cx + r * Math.cos(acc + a);
    const y2 = cy + r * Math.sin(acc + a);
    const large = a > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    acc += a;
    return <path key={i} d={path} fill={d.color} />;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="var(--bg-surface)" />
    </svg>
  );
}

window.FH = Object.assign(window.FH || {}, { NetWorthArea, IncomeExpenseBars, CategoryDonut });
