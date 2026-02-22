import type { KitchenSettings } from "@/shared/models/breakfast";

export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour > 12) return `${hour - 12}pm`;
  return `${hour}am`;
}

export function formatDayRange(days: string[]): string {
  if (days.length === 0) return "No days";
  if (days.length === 7) return "Every day";

  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const sorted = [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  const indices = sorted.map(d => dayOrder.indexOf(d));
  let isConsecutive = true;
  for (let i = 1; i < indices.length; i++) {
    if ((indices[i] ?? 0) - (indices[i - 1] ?? 0) !== 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive && sorted.length >= 3) {
    const first = dayLabels[sorted[0] ?? ""] ?? "";
    const last = dayLabels[sorted[sorted.length - 1] ?? ""] ?? "";
    return `${first}–${last}`;
  }

  return sorted.map(d => dayLabels[d] ?? d).join(", ");
}

export function isKitchenCurrentlyOpen(settings: KitchenSettings | undefined): boolean {
  if (!settings) return true;
  const now = new Date();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const currentDay = dayNames[now.getDay()] ?? "sunday";
  const currentHour = now.getHours();

  if (!settings.service_days.includes(currentDay)) return false;
  if (currentHour < settings.service_start_hour || currentHour >= settings.service_end_hour) return false;
  return true;
}
