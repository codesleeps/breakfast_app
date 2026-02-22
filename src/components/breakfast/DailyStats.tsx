"use client";

import { useState } from "react";
import { useOrderStats } from "@/client-lib/api-client";
import type { OrderStats } from "@/shared/models/breakfast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, TrendingUp, Truck, ShoppingCart, PoundSterling } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatPrice } from "./utils";

const chartConfig: ChartConfig = {
  count: {
    label: "Orders",
    color: "hsl(36, 100%, 50%)",
  },
};

function formatHourLabel(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour > 12) return `${hour - 12}pm`;
  return `${hour}am`;
}

function StatsCards({ stats }: { stats: OrderStats }) {
  const avgOrder = stats.total_orders > 0
    ? Math.round(stats.total_revenue_pence / stats.total_orders)
    : 0;
  const deliveries = stats.orders_by_delivery["delivery"] ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4 flex flex-col items-center text-center">
          <ShoppingCart className="h-5 w-5 text-amber-600 mb-1" aria-hidden="true" />
          <p className="text-2xl font-bold">{stats.total_orders}</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center text-center">
          <PoundSterling className="h-5 w-5 text-green-600 mb-1" aria-hidden="true" />
          <p className="text-2xl font-bold">{formatPrice(stats.total_revenue_pence)}</p>
          <p className="text-xs text-muted-foreground">Revenue</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center text-center">
          <Truck className="h-5 w-5 text-blue-600 mb-1" aria-hidden="true" />
          <p className="text-2xl font-bold">{deliveries}</p>
          <p className="text-xs text-muted-foreground">Deliveries</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex flex-col items-center text-center">
          <TrendingUp className="h-5 w-5 text-purple-600 mb-1" aria-hidden="true" />
          <p className="text-2xl font-bold">{formatPrice(avgOrder)}</p>
          <p className="text-xs text-muted-foreground">Avg Order</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersByHourChart({ data }: { data: Array<{ hour: number; count: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No order data yet today.</p>;
  }

  const chartData = data.map(d => ({
    hour: formatHourLabel(d.hour),
    count: d.count,
  }));

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-3">Orders by Hour</h4>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function PopularItems({ items }: { items: Array<{ item_name: string; total_quantity: number }> }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-3">🔥 Popular Items</h4>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.item_name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold">
                  {index + 1}
                </Badge>
                <span className="font-medium">{item.item_name}</span>
              </div>
              <span className="text-muted-foreground">{item.total_quantity} ordered</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentBreakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  const labels: Record<string, string> = { cash: "💷 Cash", card: "💳 Card", donation: "🤝 Donation" };
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-3">Payment Methods</h4>
        <div className="space-y-2">
          {entries.map(([method, count]) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={method} className="flex items-center justify-between text-sm">
                <span>{labels[method] ?? method}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-muted-foreground w-12 text-right">{count} ({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyStats() {
  const [open, setOpen] = useState(false);
  const { data: stats } = useOrderStats();

  if (!stats) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-6">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full flex items-center justify-between h-12 mb-3" aria-label={open ? "Collapse daily stats" : "Expand daily stats"}>
          <span className="font-semibold">📊 Daily Stats</span>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4">
        <StatsCards stats={stats} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OrdersByHourChart data={stats.orders_by_hour} />
          <div className="space-y-4">
            <PopularItems items={stats.popular_items} />
            <PaymentBreakdown data={stats.orders_by_payment} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
