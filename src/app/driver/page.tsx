"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrderWithItems } from "@/shared/models/breakfast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Package,
  Clock,
  CheckCircle,
  Truck,
  RefreshCw,
  Banknote,
  CreditCard,
  Heart,
} from "lucide-react";

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

function DeliveryCard({
  order,
  onMarkDelivered,
  isUpdating,
}: {
  order: OrderWithItems;
  onMarkDelivered: (orderId: string) => void;
  isUpdating: boolean;
}) {
  const address = order.address || order.flat_number || "No address provided";

  return (
    <Card className="border-2 border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">{order.resident_name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Ready at {formatTime(order.updated_at)}</span>
            </div>
          </div>
          <Badge className="bg-green-600 text-white">Ready</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address - Most prominent */}
        <div className="p-3 bg-white rounded-lg border-2 border-green-300">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-lg">{address}</p>
              {order.flat_number && order.address && (
                <p className="text-sm text-muted-foreground">Flat {order.flat_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* Phone number */}
        {order.mobile_number && (
          <a
            href={`tel:${order.mobile_number}`}
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <Phone className="h-4 w-4" />
            <span>{order.mobile_number}</span>
          </a>
        )}

        {/* Order items summary */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>Order Contents</span>
          </div>
          <ul className="text-sm pl-6 space-y-0.5">
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity}x {item.item_name}
              </li>
            ))}
          </ul>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-2 bg-yellow-50 rounded border border-yellow-200 text-sm">
            <strong>Notes:</strong> {order.notes}
          </div>
        )}

        {/* Footer with payment and total */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <PaymentBadge method={order.payment_method} />
            <span className="font-bold">{formatPrice(order.total_pence)}</span>
          </div>
          <Button
            onClick={() => onMarkDelivered(order.id)}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Delivered
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DriverPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/driver/orders");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load deliveries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleMarkDelivered = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Order marked as delivered!");
      // Remove from list
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="h-8 w-8 text-green-600" />
          <h1 className="text-2xl font-bold">Deliveries</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">Deliveries</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? "s" : ""} ready for delivery
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
          <p className="text-muted-foreground">
            No orders ready for delivery right now.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This page auto-refreshes every 30 seconds.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <DeliveryCard
              key={order.id}
              order={order}
              onMarkDelivered={handleMarkDelivered}
              isUpdating={updatingOrderId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
