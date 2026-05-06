"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  CreditCard,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Logo } from "@/components/ui/logo";
import { SidebarNavItem } from "./sidebar-nav-item";

const PLAN_PATHS = ["/budgets", "/goals", "/subscriptions"];

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/accounts", icon: CreditCard, label: "Accounts" },
  { href: "/budgets", icon: Layers, label: "Plan", matchPaths: PLAN_PATHS },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  return (
    <TooltipProvider delay={0}>
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full shrink-0 overflow-hidden border-r bg-card [transition:width_200ms_ease-in-out]",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div className="relative h-14 border-b overflow-hidden shrink-0">
        {/* Expanded layout */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-between px-3 transition-opacity duration-200 ease-in-out",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <Logo className="h-7 w-auto shrink-0" />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleCollapsed} aria-label="Collapse sidebar">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        {/* Collapsed layout */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-in-out",
          collapsed ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={toggleCollapsed} aria-label="Expand sidebar">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-2 pt-2">
        <Button
          variant="default"
          className={cn("w-full h-auto py-2 px-3", collapsed ? "justify-center gap-0" : "justify-start gap-3")}
          onClick={() => router.push("/log")}
          aria-label="Log transaction"
        >
          <PenLine className="h-4 w-4 shrink-0" />
          <span className={cn(
            "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out",
            collapsed ? "max-w-0 opacity-0" : "max-w-xs opacity-100"
          )}>
            Log transaction
          </span>
        </Button>
      </div>

      <nav aria-label="Main navigation" className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            "matchPaths" in item
              ? item.matchPaths.some((p) => pathname.startsWith(p))
              : pathname === item.href;
          return (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              isCollapsed={collapsed}
            />
          );
        })}
      </nav>

      <div className="p-2 border-t shrink-0">
        <Button
          variant="ghost"
          className={cn("w-full h-auto py-2 px-3", collapsed ? "justify-center gap-0" : "justify-start gap-3")}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-4 w-4 shrink-0" />
          ) : (
            <Moon className="h-4 w-4 shrink-0" />
          )}
          <span className={cn(
            "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out text-sm",
            collapsed ? "max-w-0 opacity-0" : "max-w-xs opacity-100"
          )}>
            {mounted && resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          </span>
        </Button>
      </div>

    </aside>
    </TooltipProvider>
  );
}
