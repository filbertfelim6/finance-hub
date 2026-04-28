import type React from "react";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Currency } from "@/lib/types/database.types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv(
  rows: Array<Record<string, string | number | boolean | null>>,
  filename: string
) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Format a raw number string for display: dots as thousands separators, comma as decimal
// e.g. "1000000.5" → "1.000.000,5"
export function formatAmountInput(raw: string): string {
  if (!raw) return "";
  const [intPart, decPart] = raw.split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart !== undefined ? `${withThousands},${decPart}` : withThousands;
}

// Parse a display-formatted string back to a raw number string
// Strips thousand dots, converts decimal comma to period
// e.g. "1.000.000,5" → "1000000.5"
export function parseAmountInput(display: string): string {
  return display.replace(/\./g, "").replace(",", ".");
}

/** Convert using a rates-from-USD map, e.g. { USD: 1, IDR: 16000, EUR: 0.92 } */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  ratesFromUsd: Record<string, number>
): number {
  if (from === to) return amount;
  const fromRate = ratesFromUsd[from] ?? 1;
  const toRate = ratesFromUsd[to] ?? 1;
  return (amount / fromRate) * toRate;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", IDR: "Rp", EUR: "€", GBP: "£", SGD: "S$", JPY: "¥",
};

/** Short axis-tick formatter: "Rp1.5B", "$1.2M", "¥154K", etc. */
export function formatCurrencyCompact(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `${sign}${sym}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `${sign}${sym}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3)  return `${sign}${sym}${(abs / 1e3).toFixed(1)}K`;
  return formatCurrency(amount, currency);
}

export const TOOLTIP_STYLE: React.CSSProperties = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid var(--tooltip-border)",
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "var(--tooltip-shadow)",
};

export function formatCurrency(amount: number, currency: string): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  if (currency === "JPY") {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
