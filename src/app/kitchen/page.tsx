"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useOrders, updateOrderStatus } from "@/client-lib/api-client";
import type { OrderWithItems } from "@/shared/models/breakfast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffAuthGate } from "@/components/StaffAuthGate";
import { DailyStats } from "@/components/breakfast/DailyStats";
import { toast } from "sonner";
import {
  Clock,
  Truck,
  Package,
  CreditCard,
  Banknote,
  Heart,
  ChefHat,
  AlertCircle,
  Printer,
  Phone,
  Sparkles,
} from "lucide-react";

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return "1 hour ago";
  return `${diffHours} hours ago`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string }
> = {
  pending: { label: "Pending", color: "text-yellow-800", bgColor: "bg-yellow-100 border-yellow-300" },
  preparing: { label: "Preparing", color: "text-blue-800", bgColor: "bg-blue-100 border-blue-300" },
  ready: { label: "Ready", color: "text-green-800", bgColor: "bg-green-100 border-green-300" },
  delivered: { label: "Delivered", color: "text-gray-600", bgColor: "bg-gray-100 border-gray-300" },
  cancelled: { label: "Cancelled", color: "text-red-800", bgColor: "bg-red-100 border-red-300" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} font-semibold`}>
      {config.label}
    </Badge>
  );
}

function PaymentBadge({ method }: { method: string }) {
  switch (method) {
    case "cash":
      return (
        <Badge variant="outline" className="text-xs gap-1">
          <Banknote className="h-3 w-3" /> Cash
        </Badge>
      );
    case "card":
      return (
        <Badge variant="outline" className="text-xs gap-1">
          <CreditCard className="h-3 w-3" /> Card
        </Badge>
      );
    case "donation":
      return (
        <Badge variant="outline" className="text-xs gap-1">
          <Heart className="h-3 w-3" /> Donation
        </Badge>
      );
    default:
      return null;
  }
}

function DeliveryBadge({ method }: { method: string }) {
  if (method === "delivery") {
    return (
      <Badge variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700">
        <Truck className="h-3 w-3" /> Delivery
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs gap-1">
      <Package className="h-3 w-3" /> Collection
    </Badge>
  );
}

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span className="font-mono">
        {now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
    </div>
  );
}

function OrderCard({
  order,
  onStatusUpdate,
}: {
  order: OrderWithItems;
  onStatusUpdate: (orderId: string, status: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const status = order.status as OrderStatus;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(newStatus);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setUpdating(null);
    }
  };

  const borderColor =
    status === "pending"
      ? "border-l-yellow-400"
      : status === "preparing"
        ? "border-l-blue-400"
        : status === "ready"
          ? "border-l-green-400"
          : status === "cancelled"
            ? "border-l-red-400"
            : "border-l-gray-300";

  return (
    <Card className={`border-l-4 ${borderColor} overflow-hidden`} role="article" aria-label={`Order from ${order.resident_name}, status: ${status}, ${order.items.map(i => `${i.quantity} ${i.item_name}`).join(', ')}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">
              {order.resident_name}
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <span className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</span>
          {order.flat_number && (
            <Badge variant="secondary" className="text-xs">
              Flat {order.flat_number}
            </Badge>
          )}
          {order.mobile_number && (
            <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-800 border-green-200">
              <Phone className="h-3 w-3" />
              {order.mobile_number}
            </Badge>
          )}
          <DeliveryBadge method={order.delivery_method} />
          <PaymentBadge method={order.payment_method} />
        </div>
        {order.delivery_method === 'delivery' && order.address && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">📍 Address:</span> {order.address}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Separator className="mb-3" />
        {/* Items */}
        <div className="space-y-1.5 mb-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                <span className="font-semibold">{item.quantity}×</span>{" "}
                {item.item_name}
              </span>
              <span className="text-muted-foreground">
                {formatPrice(item.item_price_pence * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        {/* Extras */}
        {order.extras && order.extras.length > 0 && (
          <div className="mb-3 p-2 bg-purple-50 rounded-md border border-purple-200">
            <div className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Extras
            </div>
            <div className="space-y-1">
              {order.extras.map((extra) => (
                <div key={extra.id} className="flex justify-between text-sm">
                  <span className="text-purple-800">
                    <span className="font-semibold">{extra.quantity}×</span>{" "}
                    {extra.item_name}
                  </span>
                  <span className="text-purple-600">
                    {formatPrice(extra.item_price_pence * extra.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t pt-2">
          <span>Total</span>
          <span>{formatPrice(order.total_pence)}</span>
        </div>

        {order.notes && (
          <div className="mt-3 p-2 bg-amber-50 rounded-md text-sm text-amber-800">
            <span className="font-medium">Note:</span> {order.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {status === "pending" && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-10 touch-target"
              onClick={() => handleStatusChange("preparing")}
              disabled={updating !== null}
              aria-label={`Start preparing order for ${order.resident_name}`}
            >
              {updating === "preparing" ? "Updating..." : "🍳 Start Preparing"}
            </Button>
          )}
          {status === "preparing" && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex-1 h-10 touch-target"
              onClick={() => handleStatusChange("ready")}
              disabled={updating !== null}
              aria-label={`Mark order for ${order.resident_name} as ready`}
            >
              {updating === "ready" ? "Updating..." : "✅ Mark Ready"}
            </Button>
          )}
          {status === "ready" && (
            <Button
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white flex-1 h-10 touch-target"
              onClick={() => handleStatusChange("delivered")}
              disabled={updating !== null}
              aria-label={`Mark order for ${order.resident_name} as delivered`}
            >
              {updating === "delivered" ? "Updating..." : "📦 Mark Delivered"}
            </Button>
          )}
          {status !== "delivered" && status !== "cancelled" && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 h-10 touch-target"
              onClick={() => handleStatusChange("cancelled")}
              disabled={updating !== null}
              aria-label={`Cancel order for ${order.resident_name}`}
            >
              {updating === "cancelled" ? "..." : "Cancel"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PrintableOrders({ orders }: { orders: OrderWithItems[] }) {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group orders by status for kitchen workflow
  const grouped: Record<string, OrderWithItems[]> = {};
  const statusOrder = ["pending", "preparing", "ready", "delivered", "cancelled"];
  for (const order of orders) {
    const s = order.status;
    if (!grouped[s]) grouped[s] = [];
    grouped[s]!.push(order);
  }

  const deliveryOrders = orders.filter(
    (o) => o.delivery_method === "delivery" && o.status !== "delivered" && o.status !== "cancelled"
  );

  const statusLabel: Record<string, string> = {
    pending: "⏳ PENDING",
    preparing: "🍳 PREPARING",
    ready: "✅ READY FOR COLLECTION/DELIVERY",
    delivered: "📦 DELIVERED",
    cancelled: "❌ CANCELLED",
  };

  return (
    <div className="print-orders hidden print:block">
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "3px solid #000", paddingBottom: "12px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>
          🍳 Community Kitchen — Breakfast Orders
        </h1>
        <p style={{ fontSize: "14px", margin: "4px 0 0 0", color: "#555" }}>
          {today} · Printed at{" "}
          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <p style={{ fontSize: "13px", margin: "4px 0 0 0" }}>
          Total Orders: <strong>{orders.length}</strong> · Deliveries:{" "}
          <strong>{deliveryOrders.length}</strong>
        </p>
      </div>

      {/* Delivery Summary */}
      {deliveryOrders.length > 0 && (
        <div style={{ marginBottom: "20px", border: "2px solid #d97706", padding: "10px", borderRadius: "4px", backgroundColor: "#fffbeb" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            🚚 DELIVERY ROUND
          </h2>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #d97706" }}>
                <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: "bold" }}>Flat</th>
                <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: "bold" }}>Resident</th>
                <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: "bold" }}>Items</th>
                <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: "bold" }}>Status</th>
                <th style={{ textAlign: "center", padding: "4px 8px", fontWeight: "bold" }}>✓</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOrders
                .sort((a, b) => (a.flat_number ?? "").localeCompare(b.flat_number ?? ""))
                .map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "4px 8px", fontWeight: "bold" }}>
                      {order.flat_number ?? "—"}
                    </td>
                    <td style={{ padding: "4px 8px" }}>{order.resident_name}</td>
                    <td style={{ padding: "4px 8px" }}>
                      {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")}
                    </td>
                    <td style={{ padding: "4px 8px", textTransform: "capitalize" }}>{order.status}</td>
                    <td style={{ padding: "4px 8px", textAlign: "center" }}>
                      <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #333", borderRadius: "2px" }} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders grouped by status */}
      {statusOrder.map((status) => {
        const group = grouped[status];
        if (!group || group.length === 0) return null;
        return (
          <div key={status} style={{ marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                backgroundColor: status === "pending" ? "#fef3c7" : status === "preparing" ? "#dbeafe" : status === "ready" ? "#dcfce7" : "#f3f4f6",
                padding: "6px 10px",
                borderRadius: "4px",
                margin: "0 0 8px 0",
              }}
            >
              {statusLabel[status] ?? status.toUpperCase()} ({group.length})
            </h2>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #333" }}>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Time</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Resident</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Flat</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Delivery</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Items</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Payment</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Total</th>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: "bold" }}>Notes</th>
                  <th style={{ textAlign: "center", padding: "4px 6px", fontWeight: "bold" }}>✓</th>
                </tr>
              </thead>
              <tbody>
                {group
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((order) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: "5px 6px", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {formatTime(order.created_at)}
                      </td>
                      <td style={{ padding: "5px 6px", fontWeight: "600" }}>
                        {order.resident_name}
                      </td>
                      <td style={{ padding: "5px 6px" }}>{order.flat_number ?? "—"}</td>
                      <td style={{ padding: "5px 6px", textTransform: "capitalize" }}>
                        {order.delivery_method === "delivery" ? "🚚 Delivery" : "📦 Collection"}
                      </td>
                      <td style={{ padding: "5px 6px" }}>
                        {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(", ")}
                      </td>
                      <td style={{ padding: "5px 6px", textTransform: "capitalize" }}>
                        {order.payment_method}
                      </td>
                      <td style={{ padding: "5px 6px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                        {formatPrice(order.total_pence)}
                      </td>
                      <td style={{ padding: "5px 6px", fontStyle: order.notes ? "normal" : "italic", color: order.notes ? "#000" : "#999", maxWidth: "140px" }}>
                        {order.notes || "—"}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "center" }}>
                        <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #333", borderRadius: "2px" }} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ borderTop: "2px solid #000", marginTop: "20px", paddingTop: "8px", fontSize: "11px", color: "#666", textAlign: "center" }}>
        Aston Breakfast Club · Printed{" "}
        {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

export default function KitchenDashboard() {
  return (
    <StaffAuthGate>
      <KitchenDashboardContent />
    </StaffAuthGate>
  );
}

function KitchenDashboardContent() {
  const [activeTab, setActiveTab] = useState("all");
  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { data: orders, isLoading, error } = useOrders(statusFilter);
  // Also fetch all orders (unfiltered) for printing
  const { data: allOrders } = useOrders(undefined);
  const prevOrderCountRef = useRef<number>(0);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // New order notification
  useEffect(() => {
    if (!orders) return;
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    if (pendingCount > prevOrderCountRef.current && prevOrderCountRef.current > 0) {
      toast.info("🔔 New order received!", { duration: 5000 });
    }
    prevOrderCountRef.current = pendingCount;
  }, [orders]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const orderCounts = {
    all: allOrders?.length ?? 0,
    pending: allOrders?.filter((o) => o.status === "pending").length ?? 0,
    preparing: allOrders?.filter((o) => o.status === "preparing").length ?? 0,
    ready: allOrders?.filter((o) => o.status === "ready").length ?? 0,
    delivered: allOrders?.filter((o) => o.status === "delivered").length ?? 0,
  };

  // When filtering by tab, we use the SWR status filter for server-side filtering
  // But for "all" tab, we show everything
  const displayOrders = orders ?? [];

  return (
    <>
      <div className="max-w-6xl mx-auto print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {orderCounts.all} orders today · {orderCounts.pending} pending
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!allOrders || allOrders.length === 0}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Orders
            </Button>
            <LiveClock />
          </div>
        </div>

        {/* Daily Stats */}
        <DailyStats />

        {/* Tab Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 max-w-xl">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({orderCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending ({orderCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="preparing" className="text-xs sm:text-sm">
              Preparing ({orderCounts.preparing})
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-xs sm:text-sm">
              Ready ({orderCounts.ready})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs sm:text-sm">
              Done ({orderCounts.delivered})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center text-red-700 flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load orders. Auto-retrying...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayOrders.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <ChefHat className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                No orders yet
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === "all"
                  ? "Orders will appear here when residents place them."
                  : `No ${activeTab} orders right now.`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Orders Grid */}
        {!isLoading && displayOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Printable view */}
      {allOrders && allOrders.length > 0 && <PrintableOrders orders={allOrders} />}
    </>
  );
}