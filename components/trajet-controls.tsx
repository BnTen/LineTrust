"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatWindowLabel } from "@/lib/slugs";
import type { DayType } from "@/lib/scoring";

const WINDOWS = Array.from({ length: 48 }, (_, i) => i * 30);

export function TrajetControls({
  dayType,
  windowStartMinutes,
}: {
  dayType: DayType;
  windowStartMinutes: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [flashKey, setFlashKey] = useState(0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    setFlashKey((k) => k + 1);
  }, [dayType, windowStartMinutes]);

  function update(next: { d?: DayType; w?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.d) params.set("d", next.d);
    if (next.w !== undefined) params.set("w", String(next.w));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      key={flashKey}
      className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 ${
        flashKey > 0 ? "lt-control-feedback rounded-2xl" : ""
      }`}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-ink">Type de jour</legend>
        <div className="flex gap-2">
          {(
            [
              ["weekday", "Ouvré"],
              ["weekend", "Week-end"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => update({ d: value })}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                dayType === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-ink-muted hover:text-ink"
              }`}
              aria-pressed={dayType === value}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink">Fenêtre 30 min</span>
        <select
          value={windowStartMinutes}
          onChange={(e) => update({ w: Number(e.target.value) })}
          className="h-10 min-w-[10rem] rounded-full border border-border bg-card px-4 text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {WINDOWS.map((w) => (
            <option key={w} value={w}>
              {formatWindowLabel(w)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
