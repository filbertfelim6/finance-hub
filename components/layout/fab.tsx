import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FAB() {
  return (
    <Link
      href="/log"
      className="md:hidden fixed bottom-20 right-4 z-50"
      aria-label="Log transaction"
    >
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </Link>
  );
}
