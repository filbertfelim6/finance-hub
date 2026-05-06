/* global React, FH */
function Accounts() {
  const accounts = [
    { name: "Mandiri",     type: "Checking", icon: "credit-card",   tint: "info",  fmt: FH.fmtIDR, balance: 5841067,    sub: "≈ Rp 5,841,067" },
    { name: "USD Savings", type: "Savings",  icon: "piggy-bank",    tint: "bad",   fmt: FH.fmtIDR, balance: 1338850880, sub: "≈ $83,678.18" },
    { name: "JPY Savings", type: "Savings",  icon: "piggy-bank",    tint: "good",  fmt: FH.fmtIDR, balance: 4142394822, sub: "≈ ¥40,000,000" },
    { name: "Cash",        type: "Cash",     icon: "wallet",        tint: "warn",  fmt: FH.fmtIDR, balance: 20000000,   sub: "≈ Rp 20,000,000" },
  ];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Accounts</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="input" style={{ padding: "6px 12px" }}>
            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>IDR — Indonesian Rupiah</span>
            <FH.Icon name="chevron-down" size={12} />
          </div>
          <FH.Button icon="plus">Add account</FH.Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {accounts.map((a) => (
          <FH.Card key={a.name}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FH.IconTile name={a.icon} tint={a.tint} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{a.type}</div>
                </div>
              </div>
              <span style={{ color: "var(--fg-3)", fontSize: 18, lineHeight: 1 }}>···</span>
            </div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Balance</div>
            <div className="figure-lg">{a.fmt(a.balance)}</div>
            <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 2, fontFeatureSettings: "'tnum' 1" }}>{a.sub}</div>
          </FH.Card>
        ))}
      </div>
    </>
  );
}

window.Accounts = Accounts;
