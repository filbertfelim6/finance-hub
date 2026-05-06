import { useQuery } from "@tanstack/react-query";
import { getAllExchangeRates } from "@/lib/queries/exchange-rates";

const FALLBACK_RATES: Record<string, number> = { USD: 1, IDR: 16000, EUR: 0.92, SGD: 1.35, GBP: 0.79, JPY: 154 };

/** Returns rates map from USD base — e.g. { USD: 1, IDR: 16000, EUR: 0.92 } */
export function useExchangeRates(): Record<string, number> {
  const { data } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: getAllExchangeRates,
    staleTime: 1000 * 60 * 60,
  });
  return data ?? FALLBACK_RATES;
}

