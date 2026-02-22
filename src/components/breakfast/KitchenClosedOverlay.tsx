"use client";

import type { KitchenSettings } from "@/shared/models/breakfast";
import { formatDayRange, formatHour } from "./utils";

export function KitchenClosedOverlay({ settings }: { settings: KitchenSettings }) {
  const daysLabel = formatDayRange(settings.service_days);
  const startLabel = formatHour(settings.service_start_hour);
  const endLabel = formatHour(settings.service_end_hour);

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center mb-6" role="alert">
      <div className="text-4xl mb-3">😴</div>
      <h2 className="text-xl font-bold text-amber-900 mb-2">Kitchen is Closed</h2>
      <p className="text-amber-800 mb-3">
        Our kitchen is open <strong>{daysLabel}</strong> from{" "}
        <strong>{startLabel}</strong> to <strong>{endLabel}</strong>.
      </p>
      <p className="text-amber-700 text-sm">
        You can still browse the menu below. See you then! 🍳
      </p>
    </div>
  );
}
