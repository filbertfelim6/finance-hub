/* global React, FH */
function Portfolio() {
  const holdings = [
    { sym: "BBCA",  name: "Bank Central Asia",   shares: 1200, price: 9450,    chg:  1.4, alloc: "32%", color: "#5a7a4e" },
    { sym: "TLKM",  name: "Telkom Indonesia",     shares: 4000, price: 3120,    chg: -0.6, alloc: "21%", color: "#7d9870" },
    { sym: "VOO",   name: "Vanguard S&P 500",     shares: 12,   price: 514.20,  chg:  0.9, alloc: "18%", color: "#c89b3c" },
    { sym: "QQQ",   name: "Invesco QQQ",          shares: 8,    price: 478.30,  chg:  1.7, alloc: "14%", color: "#b8615a" },
    { sym: "GOLD",  name: "Gold ETF",             shares: 25,   price: 240500,  chg: -0.2, alloc: "9%",  color: "#5a7a8e" },
    { sym: "BTC",   name: "Bitcoin",              shares: 0.12, price: 1140000000, chg: 2.4, alloc: "6%", color: "#8b6f9c" },
  ];
  const allocData = holdings.map((h) => ({ name: h.sym, value: parseFloat(h.alloc), color: h.color }));

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Portfolio</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <FH.PeriodSelector value="1Y" onChange={() => {}} />
          <FH.Button icon="plus">Add holding</FH.Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16 }}>
        <FH.Card>
          <FH.Eyebrow>Total value</FH.Eyebrow>
          <div className="figure-xl" style={{ margin: "8px 0 4px" }}>Rp 1.842.500.000</div>
          <div className="delta-good" style={{ fontSize: 13 }}>+ Rp 24.180.000 · +1.32% today</div>
          <div style={{ marginTop: 16 }}>
            <FH.NetWorthArea height={160} />
          </div>
        </FH.Card>
        <FH.Card>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>Allocation</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <FH.CategoryDonut size={150} data={allocData} />
            <div style={{ flex: 1, fontSize: 13 }}>
              {holdings.slice(0, 5).map((h) => (
                <div key={h.sym} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <span style={{ width: 8, height: 8, background: h.color, borderRadius: 999, display: "inline-block" }} />
                  <span style={{ flex: 1, color: "var(--fg-2)" }}>{h.sym}</span>
                  <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{h.alloc}</span>
                </div>
              ))}
            </div>
          </div>
        </FH.Card>
      </div>

      <FH.Card style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 140px 80px 60px", padding: "12px 20px", borderBottom: "1px solid var(--border-soft)" }}>
          {["Symbol","Name","Shares","Price","Day","Alloc"].map((h) => (
            <div key={h} className="eyebrow">{h}</div>
          ))}
        </div>
        {holdings.map((h, i) => (
          <div key={h.sym} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px 140px 80px 60px", padding: "14px 20px", alignItems: "center", borderBottom: i < holdings.length - 1 ? "1px solid var(--divider)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, background: h.color, borderRadius: 999 }} />
              <span style={{ fontWeight: 600 }}>{h.sym}</span>
            </div>
            <div style={{ color: "var(--fg-2)" }}>{h.name}</div>
            <div style={{ fontFeatureSettings: "'tnum' 1" }}>{h.shares}</div>
            <div style={{ fontFeatureSettings: "'tnum' 1" }}>{h.price.toLocaleString("id-ID")}</div>
            <div className={h.chg >= 0 ? "delta-good" : "delta-bad"} style={{ fontSize: 13 }}>
              {h.chg >= 0 ? "+" : "−"}{Math.abs(h.chg).toFixed(2)}%
            </div>
            <div style={{ color: "var(--fg-2)" }}>{h.alloc}</div>
          </div>
        ))}
      </FH.Card>
    </>
  );
}

window.Portfolio = Portfolio;
