"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  isActive,
  isCollapsed,
}: SidebarNavItemProps) {
  const linkElement = (
    <Link
      href={href}
      aria-label={isCollapsed ? label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn(
        "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out",
        isCollapsed ? "max-w-0 opacity-0" : "max-w-xs opacity-100"
      )}>
        {label}
      </span>
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={linkElement} />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return linkElement;
}
