import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountCard } from "@/components/accounts/account-card";
import type { Account } from "@/lib/types/database.types";

// Mock DropdownMenu so content is always rendered in JSDOM (no Portal issues)
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({
    children,
    render: renderProp,
  }: {
    children?: React.ReactNode;
    render?: React.ReactElement;
    asChild?: boolean;
  }) => (
    <div>
      {renderProp ?? children}
    </div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    onSelect,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    onSelect?: () => void;
    className?: string;
  }) => (
    <button type="button" className={className} onClick={onClick ?? onSelect}>
      {children}
    </button>
  ),
}));

const mockAccount: Account = {
  id: "1",
  user_id: "u1",
  name: "BCA Savings",
  type: "savings",
  currency: "IDR",
  balance: 5000000,
  color: "#22c55e",
  icon: "wallet",
  is_archived: false,
  created_at: "2026-04-23T00:00:00Z",
};

describe("AccountCard", () => {
  it("renders account name and formatted balance", () => {
    render(<AccountCard account={mockAccount} onEdit={vi.fn()} onArchive={vi.fn()} />);
    expect(screen.getByText("BCA Savings")).toBeInTheDocument();
    expect(screen.getByText(/5\.000\.000/)).toBeInTheDocument();
  });

  it("calls onEdit when edit is clicked", async () => {
    const onEdit = vi.fn();
    render(<AccountCard account={mockAccount} onEdit={onEdit} onArchive={vi.fn()} />);
    await userEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalled();
  });

  it("trigger button click does not bubble to parent (stopPropagation)", async () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <AccountCard account={mockAccount} onEdit={vi.fn()} onArchive={vi.fn()} />
      </div>
    );
    await userEvent.click(screen.getByRole("button", { name: /more/i }));
    expect(parentClick).not.toHaveBeenCalled();
  });
});
