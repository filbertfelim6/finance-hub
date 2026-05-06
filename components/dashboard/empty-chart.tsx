import { BarChart2 } from "lucide-react";

export function EmptyChart({ message = "No data for this period" }: { message?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center min-h-[180px]">
      <BarChart2 className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
