"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

export function DetailsStep({ state, update, onSubmit, isPending }: DetailsStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-center">Details</h2>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium block mb-1">Date</label>
          <Input
            type="date"
            value={state.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Notes (optional)</label>
          <Textarea
            placeholder="Add a note…"
            value={state.notes}
            onChange={(e) => update({ notes: e.target.value })}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={state.isRecurring}
            onClick={() => update({ isRecurring: !state.isRecurring })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.isRecurring ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.isRecurring ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <label className="text-sm font-medium">Repeat</label>
        </div>

        {state.isRecurring && (
          <Select
            value={state.recurringFrequency}
            onValueChange={(v) => update({ recurringFrequency: v as RecurringFrequency })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={isPending}>
        {isPending ? "Saving…" : "Save transaction"}
      </Button>
    </div>
  );
}
