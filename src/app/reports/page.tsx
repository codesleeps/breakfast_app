"use client";

import { useState } from "react";
import { useOrderStats } from "@/client-lib/api-client";
import { StaffAuthGate } from "@/components/StaffAuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  Package,
  AlertCircle,
  Calendar,
} from "lucide-react";

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

type DateRange = "today" | "week" | "month" | "all";

export default function ReportsPage() {
  return (
    <StaffAuthGate>
      <ReportsContent />
    </StaffAuthGate>
  );
}

function ReportsContent() {
  const [range, setRange] = useState<DateRange>("week");
  const { data: stats, isLoading, error } = useOrderStats(range);

  const rangeLabels: Record<DateRange, string> = {
    today: "Today",
    week: "Last 7 Days",
    month: "Last 30 Days",
    all: "All Time",
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-muted-foreground">
              {rangeLabels[range]} performance overview
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month", "all"] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
              className={range === r ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {rangeLabels[r]}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-6 text-center text-red-700 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load report data.</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total_orders}</div>
                {range !== "today" && stats.orders_by_day && stats.orders_by_day.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg {(stats.total_orders / stats.orders_by_day.length).toFixed(1)}/day
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatPrice(stats.total_revenue_pence)}
                </div>
                {range !== "today" && stats.orders_by_day && stats.orders_by_day.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg {formatPrice(stats.total_revenue_pence / stats.orders_by_day.length)}/day
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.orders_by_delivery.delivery ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total_orders > 0
                    ? `${Math.round(((stats.orders_by_delivery.delivery ?? 0) / stats.total_orders) * 100)}% of orders`
                    : "No orders yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Collections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.orders_by_delivery.collection ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total_orders > 0
                    ? `${Math.round(((stats.orders_by_delivery.collection ?? 0) / stats.total_orders) * 100)}% of orders`
                    : "No orders yet"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend Chart (for week/month views) */}
          {stats.orders_by_day && stats.orders_by_day.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.orders_by_day.map((day) => {
                    const maxCount = Math.max(...stats.orders_by_day!.map((d) => d.count));
                    const widthPct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-muted-foreground font-mono">
                          {formatDate(day.date)}
                        </div>
                        <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-amber-500 rounded-lg transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-xs font-medium">
                              {day.count} orders · {formatPrice(day.revenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Popular Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Items</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.popular_items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items ordered yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.popular_items.map((item, idx) => (
                      <div key={item.item_name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              idx === 0
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : ""
                            }
                          >
                            #{idx + 1}
                          </Badge>
                          <span className="text-sm font-medium">{item.item_name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.total_quantity} sold
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.orders_by_status).map(([status, count]) => {
                    const colors: Record<string, string> = {
                      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
                      preparing: "bg-blue-100 text-blue-800 border-blue-300",
                      ready: "bg-green-100 text-green-800 border-green-300",
                      delivered: "bg-gray-100 text-gray-800 border-gray-300",
                      cancelled: "bg-red-100 text-red-800 border-red-300",
                    };
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant="outline" className={colors[status] ?? ""}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.orders_by_payment).map(([method, count]) => {
                    const pct =
                      stats.total_orders > 0
                        ? Math.round((count / stats.total_orders) * 100)
                        : 0;
                    return (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{method}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Peak Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.orders_by_hour.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data available</p>
                ) : (
                  <div className="flex items-end gap-1 h-32">
                    {/* Fill in all hours from 6am to 2pm */}
                    {Array.from({ length: 9 }, (_, i) => i + 6).map((hour) => {
                      const hourData = stats.orders_by_hour.find((h) => h.hour === hour);
                      const count = hourData?.count ?? 0;
                      const maxCount = Math.max(...stats.orders_by_hour.map((h) => h.count));
                      const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={hour} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-amber-500 rounded-t transition-all"
                            style={{ height: `${Math.max(heightPct, 4)}%` }}
                          />
                          <span className="text-xs text-muted-foreground mt-1">
                            {hour}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
