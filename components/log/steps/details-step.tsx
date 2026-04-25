import { Button } from "@/components/ui/button";
import type { RecurringFrequency } from "@/lib/types/database.types";

interface DetailsState {
  date: string;
  notes: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
}

interface DetailsStepProps {
  state: DetailsState;
  update: (patch: Partial<DetailsState>) => void;
  onSubmit: () => void;
  isPending?: boolean;
}

export function DetailsStep({ onSubmit, isPending }: DetailsStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Details</h2>
      <Button className="w-full" onClick={onSubmit} disabled={isPending}>
        {isPending ? "Saving…" : "Save transaction"}
      </Button>
    </div>
  );
}
