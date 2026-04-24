import { useQuery } from "@tanstack/react-query";
import { getExchangeRate } from "@/lib/queries/exchange-rates";

export function useExchangeRate(from: string, to: string) {
  return useQuery({
    queryKey: ["exchange-rate", from, to],
    queryFn: () => getExchangeRate(from, to),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/** Returns USD→IDR rate (e.g. 16000), defaulting to 16000 while loading */
export function useUsdToIdr(): number {
  const { data } = useExchangeRate("USD", "IDR");
  return data ?? 16000;
}
