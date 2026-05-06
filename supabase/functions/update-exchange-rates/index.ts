import { createClient } from "jsr:@supabase/supabase-js@2";

const CURRENCIES = ["IDR", "EUR", "GBP", "SGD", "JPY"];

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== Deno.env.get("CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch USD-based rates from open.er-api.com (free, no API key required)
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) {
    const msg = `FX API returned ${res.status}`;
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  if (data.result !== "success") {
    console.error("FX API error:", data);
    return new Response(JSON.stringify({ error: "FX API error", detail: data }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = CURRENCIES
    .filter((to) => data.rates[to] != null)
    .map((to) => ({
      from_currency: "USD",
      to_currency: to,
      rate: data.rates[to],
      fetched_at: new Date().toISOString(),
    }));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase
    .from("exchange_rates")
    .upsert(rows, { onConflict: "from_currency,to_currency" });

  if (error) {
    console.error("DB upsert failed:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rates = Object.fromEntries(rows.map((r) => [r.to_currency, r.rate]));
  console.log("Exchange rates updated:", rates);
  return new Response(JSON.stringify({ updated: rows.length, rates }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
