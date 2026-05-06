import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogForm } from "@/components/log/log-form";

vi.mock("@/lib/hooks/use-accounts", () => ({
  useAccounts: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/lib/hooks/use-categories", () => ({
  useCategories: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/lib/hooks/use-transactions", () => ({
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateTransfer: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("@/lib/hooks/use-exchange-rate", () => ({
  useExchangeRates: () => ({ USD: 1, IDR: 16000, EUR: 0.92, SGD: 1.35, GBP: 0.79, JPY: 149 }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("LogForm", () => {
  it("starts on the type step", () => {
    render(<Wrapper><LogForm /></Wrapper>);
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
  });

  it("advances to amount step after selecting Expense", async () => {
    render(<Wrapper><LogForm /></Wrapper>);
    await userEvent.click(screen.getByText("Expense"));
    expect(screen.getByPlaceholderText("0")).toBeInTheDocument();
  });

  it("can go back from amount step", async () => {
    render(<Wrapper><LogForm /></Wrapper>);
    await userEvent.click(screen.getByText("Income"));
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Expense")).toBeInTheDocument();
  });
});
