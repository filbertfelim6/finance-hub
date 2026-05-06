/* global React, FH */
const { useState, useMemo } = React;

function Transactions() {
  const [q, setQ] = useState("");

  const data = [
    { day: "Sun, 26 Apr 2026", rows: [
      { cat: "Other Expense", amt: -2000000000, cur: "Rp", date: "26 Apr" },
      { cat: "Other Expense", amt: -1000,       cur: "Rp", date: "26 Apr" },
      { cat: "Education",     amt: -20,         cur: "€",  date: "26 Apr" },
      { cat: "Education",     amt: -200000,     cur: "Rp", date: "26 Apr" },
      { cat: "Other Expense", amt: -288888,     cur: "Rp", date: "26 Apr" },
      { cat: "Other Expense", amt: -288888,     cur: "Rp", date: "26 Apr" },
      { cat: "Education",     amt: -1000000,    cur: "Rp", date: "26 Apr" },
    ]},
    { day: "Sat, 25 Apr 2026", rows: [
      { cat: "Shopping", amt: -200, cur: "$", date: "25 Apr" },
      { cat: "Shopping", amt: -200, cur: "$", date: "25 Apr" },
    ]},
    { day: "Thu, 16 Apr 2026", rows: [
      { cat: "Subscriptions", amt: -149000, cur: "Rp", date: "16 Apr" },
      { cat: "Income",        amt: 12500000, cur: "Rp", date: "16 Apr" },
    ]},
  ];

  const fmtAmt = (r) => {
    const sign = r.amt < 0 ? "−" : "+";
    const n = Math.abs(r.amt);
    if (r.cur === "Rp") return `${sign}Rp ${n.toLocaleString("id-ID")}`;
    if (r.cur === "$")  return `${sign}$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (r.cur === "€")  return `${sign}€${n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${sign}${n}`;
  };

  const filtered = useMemo(() => {
    if (!q) return data;
    const ql = q.toLowerCase();
    return data
      .map((g) => ({ ...g, rows: g.rows.filter((r) => r.cat.toLowerCase().includes(ql)) }))
      .filter((g) => g.rows.length);
  }, [q]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Transactions</h1>
        <FH.Button variant="secondary" icon="download">Export CSV</FH.Button>
      </div>

      <div className="input search" style={{ marginBottom: 12 }}>
        <FH.Icon name="search" size={14} style={{ color: "var(--fg-3)" }} />
        <input placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <FH.Chip icon="chevron-down">Type</FH.Chip>
        <FH.Chip icon="chevron-down">Category</FH.Chip>
        <FH.Chip icon="calendar">mm/dd/yyyy</FH.Chip>
        <span style={{ alignSelf: "center", color: "var(--fg-4)" }}>—</span>
        <FH.Chip icon="calendar">mm/dd/yyyy</FH.Chip>
      </div>

      {filtered.map((g) => (
        <div key={g.day}>
          <div className="day-label">{g.day}</div>
          {g.rows.map((r, i) => (
            <div key={i} className="tx-row">
              <FH.IconTile name="arrow-up-right" tint={r.amt < 0 ? "bad" : "good"} size={28} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>{r.cat}</div>
              <div className="tx-amount">
                <div style={{ color: r.amt < 0 ? "var(--bad-500)" : "var(--good-500)" }}>{fmtAmt(r)}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 400 }}>{r.date}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: "var(--fg-3)" }}>No transactions match "{q}".</div>
      )}
    </>
  );
}

window.Transactions = Transactions;
