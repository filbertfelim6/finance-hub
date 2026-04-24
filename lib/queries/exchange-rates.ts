import { createClient } from "@/lib/supabase/client";

export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("from_currency", from)
    .eq("to_currency", to)
    .single();
  if (error || !data) return from === "USD" && to === "IDR" ? 16000 : 0.0000625;
  return Number(data.rate);
}
