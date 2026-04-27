import { createClient } from "@/lib/supabase/client";

// Fallback rates ensure every supported currency works even if the DB row is missing
const SAFE_FALLBACK: Record<string, number> = {
  USD: 1,
  IDR: 16000,
  EUR: 0.92,
  GBP: 0.79,
  SGD: 1.35,
  JPY: 154,
};

/** Returns rates from USD base, e.g. { USD: 1, IDR: 16000, JPY: 154 }.
 *  Starts from built-in fallbacks so a missing DB row never silently becomes rate=1. */
export async function getAllExchangeRates(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("exchange_rates")
    .select("to_currency, rate")
    .eq("from_currency", "USD");

  // DB rows override fallbacks; missing currencies keep their fallback value
  const rates: Record<string, number> = { ...SAFE_FALLBACK };
  if (data) {
    for (const row of data) {
      rates[row.to_currency] = Number(row.rate);
    }
  }
  return rates;
}

/** Legacy single-pair lookup */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  const rates = await getAllExchangeRates();
  if (from === to) return 1;
  if (from === "USD") return rates[to] ?? 1;
  if (to === "USD") return 1 / (rates[from] ?? 1);
  return (1 / (rates[from] ?? 1)) * (rates[to] ?? 1);
}
