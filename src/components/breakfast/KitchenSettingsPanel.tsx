"use client";

import { useState, useEffect, useCallback } from "react";
import { useSettings, updateSettings } from "@/client-lib/api-client";
import type { KitchenSettings } from "@/shared/models/breakfast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Loader2, Save } from "lucide-react";
import { formatDayRange, formatHour } from "./utils";

const ALL_DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

const HOUR_OPTIONS = Array.from({ length: 7 }, (_, i) => i + 6); // 6am to 12pm

export function KitchenSettingsPanel() {
  const { data: settings, isLoading } = useSettings();
  const [localDays, setLocalDays] = useState<string[]>([]);
  const [localStart, setLocalStart] = useState<number>(8);
  const [localEnd, setLocalEnd] = useState<number>(11);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalDays(settings.service_days);
      setLocalStart(settings.service_start_hour);
      setLocalEnd(settings.service_end_hour);
      setDirty(false);
    }
  }, [settings]);

  const toggleDay = useCallback((day: string) => {
    setLocalDays(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      return next;
    });
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (localDays.length === 0) {
      toast.error("Please select at least one service day");
      return;
    }
    if (localStart >= localEnd) {
      toast.error("End hour must be after start hour");
      return;
    }

    setSaving(true);
    try {
      await updateSettings({
        service_days: localDays,
        service_start_hour: localStart,
        service_end_hour: localEnd,
      });
      toast.success("Kitchen settings updated");
      setDirty(false);
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  }, [localDays, localStart, localEnd]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    );
  }

  const summaryText = settings
    ? `Open ${formatDayRange(localDays)}, ${formatHour(localStart)}–${formatHour(localEnd)}`
    : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-amber-600" aria-hidden="true" />
          <CardTitle className="text-lg">⚙️ Kitchen Settings</CardTitle>
        </div>
        <CardDescription>
          Configure when the kitchen accepts orders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Days */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Service Days</Label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map(day => {
              const isActive = localDays.includes(day.key);
              return (
                <Button
                  key={day.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={`h-10 px-4 touch-target ${
                    isActive
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "hover:bg-amber-50"
                  }`}
                  onClick={() => toggleDay(day.key)}
                  aria-pressed={isActive}
                  aria-label={`${day.label}${isActive ? " (active)" : ""}`}
                >
                  {day.label}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Service Hours */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Service Hours</Label>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="space-y-1">
              <Label htmlFor="start-hour" className="text-xs text-muted-foreground">Start</Label>
              <Select
                value={String(localStart)}
                onValueChange={(v) => { setLocalStart(Number(v)); setDirty(true); }}
              >
                <SelectTrigger id="start-hour" className="w-28 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map(h => (
                    <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground mt-5">to</span>
            <div className="space-y-1">
              <Label htmlFor="end-hour" className="text-xs text-muted-foreground">End</Label>
              <Select
                value={String(localEnd)}
                onValueChange={(v) => { setLocalEnd(Number(v)); setDirty(true); }}
              >
                <SelectTrigger id="end-hour" className="w-28 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map(h => (
                    <SelectItem key={h} value={String(h)}>{formatHour(h)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Summary */}
        {summaryText && (
          <p className="text-sm text-muted-foreground bg-amber-50 rounded-lg p-3 border border-amber-100">
            📋 <strong>Current config:</strong> {summaryText}
          </p>
        )}

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="bg-amber-600 hover:bg-amber-700 gap-2 h-11 touch-target"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
