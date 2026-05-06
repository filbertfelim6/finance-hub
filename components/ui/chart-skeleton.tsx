import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo";

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex-1 min-h-[180px] flex items-center justify-center rounded-lg bg-muted/20",
        className
      )}
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-muted border-t-primary/70 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <LogoMark className="h-6 w-auto" />
        </div>
      </div>
    </div>
  );
}
