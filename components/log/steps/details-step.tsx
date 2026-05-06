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
    <div className="space-y-5">
      <h2 className="text-base font-semibold">Details</h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={state.date}
            onChange={(e) => update({ date: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Notes <span className="font-normal">(optional)</span></label>
          <Textarea
            placeholder="Add a note…"
            value={state.notes}
            onChange={(e) => update({ notes: e.target.value })}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Repeat</p>
            <p className="text-xs text-muted-foreground mt-0.5">Set a recurring schedule</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.isRecurring}
            onClick={() => update({ isRecurring: !state.isRecurring })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
              state.isRecurring ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                state.isRecurring ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
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
