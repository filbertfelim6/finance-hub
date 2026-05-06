/* global React, FH */
const { useState } = React;

function Dashboard() {
  const [period, setPeriod] = useState("30D");
  const [npPeriod, setNpPeriod] = useState("30D");

  const categories = [
    { name: "Other Expense", value: 1861687680, pct: "99.6%", color: "#5a7a4e" },
    { name: "Shopping",      value: 6400000,    pct: "0.3%",  color: "#c89b3c" },
    { name: "Education",     value: 1584480,    pct: "0.1%",  color: "#b8615a" },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
        <FH.Eyebrow>Total net worth</FH.Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="input" style={{ padding: "6px 10px" }}>
            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>IDR</span>
            <FH.Icon name="chevron-down" size={12} />
          </div>
          <button className="btn btn-ghost" style={{ padding: 6 }} aria-label="Toggle visibility">
            <FH.Icon name="eye" />
          </button>
        </div>
      </div>
      <div className="figure-xl" style={{ marginBottom: 24 }}>Rp 5.507.086.769</div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <FH.Eyebrow>Period summary</FH.Eyebrow>
        <FH.PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Period summary tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <FH.Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <FH.IconTile name="trending-up" tint="good" />
          </div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Income</div>
          <div className="figure-md">Rp 0</div>
        </FH.Card>
        <FH.Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <FH.IconTile name="trending-down" tint="bad" />
          </div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Expenses</div>
          <div className="figure-md">Rp 1.869.672.160</div>
        </FH.Card>
        <FH.Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <FH.IconTile name="percent" tint="warn" />
          </div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Savings rate</div>
          <div className="figure-md">0.0%</div>
        </FH.Card>
      </div>

      {/* Net worth chart */}
      <FH.Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Net Worth</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="input" style={{ padding: "5px 10px", fontSize: 12 }}>
              <span>All accounts</span>
              <FH.Icon name="chevron-down" size={12} />
            </div>
            <FH.PeriodSelector value={npPeriod} onChange={setNpPeriod} />
          </div>
        </div>
        <FH.NetWorthArea height={240} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "var(--fg-3)", padding: "0 4px" }}>
          {["Mar 30","Apr 4","Apr 8","Apr 12","Apr 16","Apr 20","Apr 24","Apr 28"].map((d) => <span key={d}>{d}</span>)}
        </div>
      </FH.Card>

      {/* Two-up: Income vs Expenses + Spending by Category */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FH.Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>Income vs Expenses</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <div className="input" style={{ padding: "5px 10px", fontSize: 12 }}>
              <span>All accounts</span>
              <FH.Icon name="chevron-down" size={12} />
            </div>
            <FH.PeriodSelector value="30D" onChange={() => {}} options={["7D","30D","90D","1Y","Custom"]} />
          </div>
          <FH.IncomeExpenseBars />
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "var(--fg-3)" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#5a7a4e", borderRadius: 2, marginRight: 6, verticalAlign: "middle" }} />Income</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#b8615a", borderRadius: 2, marginRight: 6, verticalAlign: "middle" }} />Expenses</span>
          </div>
        </FH.Card>

        <FH.Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>Spending by Category</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
            <div className="input" style={{ padding: "5px 10px", fontSize: 12 }}>
              <span>All accounts</span>
              <FH.Icon name="chevron-down" size={12} />
            </div>
            <FH.PeriodSelector value="30D" onChange={() => {}} />
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <FH.CategoryDonut size={170} data={categories} />
            <div style={{ flex: 1 }}>
              {categories.map((c) => (
                <div key={c.name} className="donut-legend-row">
                  <span className="donut-legend-dot" style={{ background: c.color }} />
                  <span style={{ color: "var(--fg-2)" }}>{c.name}</span>
                  <span style={{ fontFeatureSettings: "'tnum' 1", color: "var(--fg-1)", fontWeight: 500 }}>{FH.fmtIDR(c.value)}</span>
                  <span style={{ color: "var(--fg-3)", fontSize: 12 }}>{c.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </FH.Card>
      </div>
    </>
  );
}

window.Dashboard = Dashboard;
