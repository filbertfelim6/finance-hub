/* global React, FH */
const { useState, useRef, useEffect } = React;

function ChatPanel() {
  const [msgs, setMsgs] = useState([
    { role: "ai", text: "Hi — I'm grounded in your transactions and portfolio. Ask me anything about your money. For example: \"How much did I spend on Education last week?\" or \"Why did my net worth dip on April 24?\"" },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [msgs, busy]);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setDraft("");
    setBusy(true);
    try {
      const sys = "You are FinanceHub's AI assistant. Tone: composed, quietly knowledgeable, plain English first. Never use emoji. Use a real minus (−) for negatives. Keep replies short (2-3 sentences). The user's totals: Net worth Rp 5,507,086,769. 30D expenses Rp 1,869,672,160. Top category: Other Expense (99.6%). Accounts: Mandiri (Rp 5,841,067), USD Savings ($83,678.18), JPY Savings (¥40,000,000), Cash (Rp 20,000,000).";
      const reply = await window.claude.complete({
        messages: [{ role: "user", content: sys + "\n\nUser asks: " + text }],
      });
      setMsgs((m) => [...m, { role: "ai", text: reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "ai", text: "I couldn't reach the model just now. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = [
    "How much did I spend on Education this month?",
    "Why did my net worth dip on Apr 24?",
    "Suggest a savings goal based on my income.",
  ];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Ask AI</h1>
        <FH.Chip icon="sparkles">Beta</FH.Chip>
      </div>

      <div className="chat-shell">
        <div className="chat-stream" ref={streamRef}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex" }}>
              <div className={"bubble " + (m.role === "ai" ? "bubble-ai" : "bubble-user")}>{m.text}</div>
            </div>
          ))}
          {busy && (
            <div style={{ display: "flex" }}>
              <div className="bubble bubble-ai" style={{ display: "inline-flex", gap: 4 }}>
                <span className="tdot" /><span className="tdot" /><span className="tdot" />
              </div>
            </div>
          )}
          {msgs.length === 1 && (
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {suggestions.map((s) => (
                <button key={s} className="chip" onClick={() => setDraft(s)} style={{ cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          )}
        </div>
        <div className="chat-compose">
          <div className="input" style={{ flex: 1 }}>
            <input
              placeholder="Ask anything about your money…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            />
          </div>
          <FH.Button icon="arrow-up" onClick={send} disabled={busy || !draft.trim()}>Send</FH.Button>
        </div>
      </div>

      <style>{`
        .tdot { width:6px; height:6px; border-radius:999px; background: var(--fg-3); display:inline-block; animation: tdot 1.4s infinite; }
        .tdot:nth-child(2) { animation-delay: 0.2s; }
        .tdot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes tdot { 0%,80%,100% { opacity:0.3; transform: translateY(0); } 40% { opacity:1; transform: translateY(-2px); } }
      `}</style>
    </>
  );
}

window.ChatPanel = ChatPanel;
