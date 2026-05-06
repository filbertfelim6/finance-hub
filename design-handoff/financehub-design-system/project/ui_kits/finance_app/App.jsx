/* global React, ReactDOM, FH, Sidebar, Dashboard, Accounts, Transactions, Portfolio, ChatPanel */
const { useState, useEffect } = React;

function App() {
  const [view, setView] = useState("dashboard");
  const [theme, setTheme] = useState("light");
  const [collapsed, setCollapsed] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  let content;
  if (view === "dashboard")    content = <Dashboard />;
  else if (view === "accounts") content = <Accounts />;
  else if (view === "transactions") content = <Transactions />;
  else if (view === "portfolio")    content = <Portfolio />;
  else if (view === "ask")     content = <ChatPanel />;
  else if (view === "settings") content = (
    <>
      <div className="page-head"><h1 className="page-title">Settings</h1></div>
      <FH.Card><div style={{ color: "var(--fg-3)", padding: "20px 0", textAlign: "center" }}>Settings — left intentionally blank in this kit.</div></FH.Card>
    </>
  );

  return (
    <div className="app" data-collapsed={collapsed}>
      <Sidebar
        view={view} onNav={setView}
        theme={theme} onToggleTheme={() => setTheme((t) => t === "dark" ? "light" : "dark")}
        collapsed={collapsed} onCollapse={() => setCollapsed((c) => !c)}
        onLog={() => setLogOpen(true)}
      />
      <main className="main">{content}</main>

      {logOpen && (
        <div onClick={() => setLogOpen(false)} style={{ position: "fixed", inset: 0, background: "var(--bg-overlay)", display: "grid", placeItems: "center", zIndex: 50, backdropFilter: "blur(6px)" }}>
          <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: 440, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Log transaction</h3>
              <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setLogOpen(false)}><FH.Icon name="x" /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Amount</div>
                <div className="input"><span style={{ color: "var(--fg-3)" }}>Rp</span><input placeholder="0" /></div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Category</div>
                <div className="input"><input placeholder="Shopping, Food, …" /></div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Note</div>
                <div className="input"><input placeholder="Optional" /></div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                <FH.Button variant="ghost" onClick={() => setLogOpen(false)}>Cancel</FH.Button>
                <FH.Button onClick={() => setLogOpen(false)}>Save</FH.Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
