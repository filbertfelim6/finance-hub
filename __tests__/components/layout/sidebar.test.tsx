import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "@/components/layout/sidebar";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({ resolvedTheme: "light", setTheme: vi.fn() })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  })),
}));

describe("Sidebar", () => {
  it("renders all nav items", () => {
    render(<Sidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accounts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /transactions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /budgets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /settings/i })).toBeInTheDocument();
  });

  it("collapses to icon-only when toggle is clicked", async () => {
    render(<Sidebar />);
    const user = userEvent.setup();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /collapse/i }));
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expand/i })).toBeInTheDocument();
  });

  it("highlights the active nav item", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("calls signOut and redirects when sign out is clicked", async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    const mockPush = vi.fn();
    vi.mocked(createClient).mockReturnValue({
      auth: { signOut: mockSignOut },
    } as any);
    // Re-mock useRouter to capture push
    vi.mocked(useRouter).mockReturnValue({ push: mockPush, refresh: vi.fn() } as any);
    render(<Sidebar />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalled();
    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith("/auth/login"));
  });

  it("theme toggle changes theme", async () => {
    const mockSetTheme = vi.fn();
    vi.mocked(useTheme).mockReturnValue({ resolvedTheme: "light", setTheme: mockSetTheme } as any);
    render(<Sidebar />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
