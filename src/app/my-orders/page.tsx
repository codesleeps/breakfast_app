"use client";

import { useState, useEffect } from "react";
import { getAuthClient, authClient } from "@/client-lib/auth-client";
import type { OrderWithItems } from "@/shared/models/breakfast";
import { formatPrice } from "@/components/breakfast/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, ShoppingBag, Clock } from "lucide-react";

function statusColor(status: string) {
  switch (status) {
    case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "preparing": return "bg-blue-100 text-blue-800 border-blue-300";
    case "ready": return "bg-green-100 text-green-800 border-green-300";
    case "delivered": return "bg-gray-100 text-gray-800 border-gray-300";
    case "cancelled": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MyOrdersPage() {
  const { data: session } = getAuthClient();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    async function fetchOrders() {
      try {
        const res = await fetch("/api/my-orders");
        if (!res.ok) {
          throw new Error("Failed to fetch orders");
        }
        const data = await res.json();
        setOrders(data);
      } catch {
        setError("Failed to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [session]);

  const handleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/my-orders",
    });
  };

  if (!session?.user) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-amber-200">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-amber-500" />
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Sign in to view your order history</p>
            <Button onClick={handleSignIn} className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-6">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-4">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center text-red-700">
            <p role="alert">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <Card className="border-amber-200">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No orders yet. Place your first order from the menu!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="border-amber-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <Badge className={`${statusColor(order.status)} capitalize text-xs`}>
                    {order.status}
                  </Badge>
                </div>
                <div className="space-y-1 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        <span className="font-medium">{item.quantity}x</span> {item.item_name}
                      </span>
                      <span className="text-muted-foreground">{formatPrice(item.item_price_pence * item.quantity)}</span>
                    </div>
                  ))}
                  {order.extras?.map((extra) => (
                    <div key={extra.id} className="flex justify-between text-sm text-purple-700">
                      <span>
                        <span className="font-medium">{extra.quantity}x</span> {extra.item_name}
                      </span>
                      <span>{formatPrice(extra.item_price_pence * extra.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs capitalize">{order.delivery_method}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{order.payment_method}</Badge>
                  </div>
                  <span className="font-bold text-amber-800">{formatPrice(order.total_pence)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
