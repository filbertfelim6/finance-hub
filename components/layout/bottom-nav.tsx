"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Layers,
  Settings,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLAN_PATHS = ["/budgets", "/goals", "/subscriptions"];

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/accounts", icon: CreditCard, label: "Accounts" },
  { href: "/budgets", icon: Layers, label: "Plan", matchPaths: PLAN_PATHS },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="relative bg-background/95 backdrop-blur border-t supports-[padding-bottom:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]">
        {/* Log button — center is on the border-t line */}
        <Link
          href="/log"
          aria-label="Log transaction"
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4 z-10 flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg ring-[3px] ring-background transition-opacity hover:opacity-90"
        >
          <PenLine className="h-6 w-6" />
        </Link>

        <div className="flex items-center justify-around px-2 pt-2 pb-2">
          {/* Home + Accounts */}
          {NAV_ITEMS.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Spacer for the floating button */}
          <div className="w-14 shrink-0" aria-hidden="true" />

          {/* Plan + Settings */}
          {NAV_ITEMS.slice(2).map((item) => {
            const isActive =
              "matchPaths" in item
                ? item.matchPaths.some((p) => pathname.startsWith(p))
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
