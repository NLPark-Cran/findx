"use client";

import { cn } from "@/lib/utils";
import { WEAPONS, getWeaponById, labelWeapon } from "@/lib/weapons";

interface WeaponHandProps {
  selected?: string;
  onSelect: (id: string) => void;
  locale?: string;
  recommended?: string[];
}

export function WeaponHand({ selected, onSelect, locale = "zh", recommended = [] }: WeaponHandProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {WEAPONS.map((w) => {
        const isSelected = selected === w.id;
        const isRecommended = recommended.includes(w.id);
        return (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            className={cn(
              "relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all active:scale-95",
              isSelected
                ? "border-primary bg-primary/10 shadow-sm"
                : isRecommended
                ? "border-accent/50 bg-accent/5 hover:border-accent"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            {isRecommended && !isSelected && (
              <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                {locale === "zh" ? "推荐" : "Recommended"}
              </span>
            )}
            <span className="text-3xl">{w.icon}</span>
            <h4 className="mt-3 text-sm font-semibold leading-tight text-foreground">{labelWeapon(w, locale)}</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {locale === "zh" ? w.description.zh : w.description.en}
            </p>
          </button>
        );
      })}
    </div>
  );
}

export function WeaponMini({ id, locale = "zh" }: { id: string; locale?: string }) {
  const w = getWeaponById(id);
  if (!w) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
      <span>{w.icon}</span>
      <span>{labelWeapon(w, locale)}</span>
    </span>
  );
}
