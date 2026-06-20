"use client";

import { cn } from "@/lib/utils";
import { FALLACIES, labelFallacy, type Fallacy } from "@/lib/fallacies";

interface FallacyDetectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  locale?: string;
  max?: number;
}

export function FallacyDetector({ selected, onChange, locale = "zh", max = 2 }: FallacyDetectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < max) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {FALLACIES.map((f: Fallacy) => {
        const isSelected = selected.includes(f.id);
        return (
          <button
            key={f.id}
            onClick={() => toggle(f.id)}
            className={cn(
              "flex flex-col items-start rounded-2xl border p-4 text-left transition-all active:scale-95",
              isSelected
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-2xl">{f.icon}</span>
              {isSelected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  ✓
                </span>
              )}
            </div>
            <h4 className="mt-3 text-sm font-semibold leading-tight text-foreground">{labelFallacy(f, locale)}</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {locale === "zh" ? f.description_zh : f.description_en}
            </p>
          </button>
        );
      })}
    </div>
  );
}
