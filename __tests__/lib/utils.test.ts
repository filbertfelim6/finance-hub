import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats USD", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
  });
  it("formats IDR without decimals", () => {
    expect(formatCurrency(1500000, "IDR")).toMatch(/1\.500\.000/);
  });
});
