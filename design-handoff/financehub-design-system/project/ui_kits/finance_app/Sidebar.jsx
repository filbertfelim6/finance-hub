/* global React, FH */
const { useState } = React;

function Sidebar({ view, onNav, theme, onToggleTheme, collapsed, onCollapse, onLog }) {
  const items = [
    { id: "dashboard",    label: "Dashboard",    icon: "layout-dashboard" },
    { id: "accounts",     label: "Accounts",     icon: "credit-card" },
    { id: "transactions", label: "Transactions", icon: "repeat" },
    { id: "portfolio",    label: "Portfolio",    icon: "trending-up" },
    { id: "ask",          label: "Ask AI",       icon: "sparkles" },
    { id: "settings",     label: "Settings",     icon: "settings" },
  ];
  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <span className="sb-brand-name">FinanceHub</span>
        <button className="sb-collapse" onClick={onCollapse} aria-label="Collapse">
          <FH.Icon name={collapsed ? "chevron-right" : "chevron-left"} size={14} />
        </button>
      </div>
      <button className="sb-cta" onClick={onLog}>
        <FH.Icon name="pencil" />
        <span className="sb-label">Log transaction</span>
      </button>
      {items.map((it) => (
        <button key={it.id}
          className="sb-item"
          aria-current={view === it.id ? "page" : undefined}
          onClick={() => onNav(it.id)}>
          <FH.Icon name={it.icon} />
          <span className="sb-label">{it.label}</span>
        </button>
      ))}
      <div className="sb-spacer" />
      <button className="sb-item" onClick={onToggleTheme}>
        <FH.Icon name={theme === "dark" ? "sun" : "moon"} />
        <span className="sb-label">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>
      <button className="sb-item">
        <FH.Icon name="log-out" />
        <span className="sb-label">Sign out</span>
      </button>
    </aside>
  );
}

window.Sidebar = Sidebar;
