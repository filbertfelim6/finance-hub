import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "@/components/layout/bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("BottomNav", () => {
  it("renders 5 nav items", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });

  it("marks the active route", () => {
    render(<BottomNav />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink).toHaveClass("text-foreground");
  });
});
