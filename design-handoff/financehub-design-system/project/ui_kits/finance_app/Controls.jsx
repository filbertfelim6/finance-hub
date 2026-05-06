/* global React */
const { useState } = React;

// ---------- Number / currency helpers ----------
const fmtIDR = (n) => "Rp " + Math.abs(n).toLocaleString("id-ID");
const fmtUSD = (n) => "$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtJPY = (n) => "¥" + Math.abs(n).toLocaleString("ja-JP");
const fmtSigned = (n, fmt = fmtIDR) => (n < 0 ? "− " : "+ ") + fmt(n);

// ---------- Lucide icon helper ----------
function Icon({ name, size = 16, style = {}, ...rest }) {
  // Lucide replaces these on createIcons(); we re-call after each render in App.
  return <i data-lucide={name} style={{ width: size, height: size, display: "inline-flex", ...style }} {...rest} />;
}

// ---------- Card ----------
function Card({ children, style = {}, className = "", ...rest }) {
  return <div className={"card " + className} style={style} {...rest}>{children}</div>;
}

// ---------- Pill segmented control ----------
function PeriodSelector({ value, onChange, options = ["7D", "30D", "90D", "1Y", "Custom"] }) {
  return (
    <div className="pills">
      {options.map((opt) => (
        <button key={opt} className="pill" data-active={value === opt} onClick={() => onChange(opt)}>{opt}</button>
      ))}
    </div>
  );
}

// ---------- Buttons ----------
function Button({ variant = "primary", children, icon, ...rest }) {
  return (
    <button className={"btn btn-" + variant} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

// ---------- Eyebrow ----------
function Eyebrow({ children }) { return <div className="eyebrow">{children}</div>; }

// ---------- IconTile ----------
function IconTile({ name, tint = "info", size = 32 }) {
  const map = {
    info:   { bg: "var(--info-100)",   fg: "var(--info-500)" },
    good:   { bg: "var(--good-100)",   fg: "var(--good-500)" },
    bad:    { bg: "var(--bad-100)",    fg: "var(--bad-500)" },
    warn:   { bg: "var(--warn-100)",   fg: "var(--warn-500)" },
    cream:  { bg: "var(--cream-200)",  fg: "var(--ink-700)" },
    brand:  { bg: "var(--green-100)",  fg: "var(--green-600)" },
    mauve:  { bg: "#ece1f0",           fg: "#8b6f9c" },
  };
  const c = map[tint] || map.info;
  return (
    <div className="icon-tile" style={{ width: size, height: size, background: c.bg, color: c.fg }}>
      <Icon name={name} size={Math.round(size * 0.5)} />
    </div>
  );
}

// ---------- Chip ----------
function Chip({ children, icon }) {
  return <span className="chip">{icon && <Icon name={icon} size={12} />}{children}</span>;
}

window.FH = Object.assign(window.FH || {}, {
  Icon, Card, PeriodSelector, Button, Eyebrow, IconTile, Chip,
  fmtIDR, fmtUSD, fmtJPY, fmtSigned,
});
