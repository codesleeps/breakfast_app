"use client";

import { useState, useEffect } from "react";
import type { KitchenSettings } from "@/shared/models/breakfast";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { formatHour, isKitchenCurrentlyOpen } from "./utils";

export function ServiceStatus({ settings }: { settings: KitchenSettings | undefined }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const isOpen = isKitchenCurrentlyOpen(settings);
  const startLabel = settings ? formatHour(settings.service_start_hour) : "8am";
  const endLabel = settings ? formatHour(settings.service_end_hour) : "11am";

  return (
    <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
      <Clock className="h-4 w-4" aria-hidden="true" />
      <span>
        {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <Badge
        variant={isOpen ? "default" : "secondary"}
        className={isOpen ? "bg-green-600 hover:bg-green-700" : ""}
        aria-label={isOpen ? `Kitchen is open now, serving ${startLabel} to ${endLabel}` : `Kitchen is closed, opens ${startLabel} to ${endLabel}`}
      >
        {isOpen ? "Open Now" : "Closed"}
      </Badge>
    </div>
  );
}
