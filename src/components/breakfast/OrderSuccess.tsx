"use client";

import { useState } from "react";
import type { OrderWithItems } from "@/shared/models/breakfast";
import { useOrder, useOrdersAhead, useOrderFeedback, submitFeedback } from "@/client-lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Truck,
  Package,
  CircleDot,
  ChefHat,
  Bell,
  PartyPopper,
  Star,
  Loader2,
} from "lucide-react";
import { formatPrice } from "./utils";
import { toast } from "sonner";

function ProgressTracker({ status }: { status: string }) {
  const steps = [
    { key: "pending", label: "Order Received", icon: CheckCircle2 },
    { key: "preparing", label: "Preparing", icon: ChefHat },
    { key: "ready", label: "Ready", icon: Bell },
    { key: "delivered", label: "Delivered", icon: PartyPopper },
  ];

  const statusOrder = ["pending", "preparing", "ready", "delivered"];
  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="flex items-center justify-between w-full" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={4} aria-label="Order progress">
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex flex-col items-center flex-1 relative">
            {index > 0 && (
              <div
                className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                  index <= currentIndex ? "bg-green-500" : "bg-gray-200"
                }`}
                aria-hidden="true"
              />
            )}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                isCompleted
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400"
              } ${isCurrent ? "ring-2 ring-green-500 ring-offset-2" : ""}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <span
              className={`text-[10px] mt-1 text-center leading-tight ${
                isCompleted ? "text-green-700 font-medium" : "text-gray-400"
              }`}
            >
              {step.label}
              {isCompleted && index < currentIndex && " ✓"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function OrderSuccess({
  order,
  onNewOrder,
}: {
  order: OrderWithItems;
  onNewOrder: () => void;
}) {
  const { data: liveOrder } = useOrder(order.id);
  const { data: aheadData } = useOrdersAhead(order.id);

  const currentOrder = liveOrder ?? order;
  const ordersAhead = aheadData?.count ?? 0;
  const estimatedMinutes = Math.max(5, ordersAhead * 5 + 5);

  const timePlaced = new Date(currentOrder.created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-green-100 rounded-full p-6 mb-6">
        <CheckCircle2 className="h-16 w-16 text-green-600" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Order Placed! 🎉</h2>
      <p className="text-muted-foreground mb-6">
        Thank you, {currentOrder.resident_name}!
      </p>

      {/* Order Number */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-6 py-3 mb-4">
        <p className="text-xs text-amber-700 uppercase tracking-wide font-medium">Order Number</p>
        <p className="text-2xl font-mono font-bold text-amber-900">
          #{currentOrder.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Progress Tracker */}
      <Card className="w-full max-w-sm mb-4">
        <CardContent className="p-4">
          <ProgressTracker status={currentOrder.status} />
        </CardContent>
      </Card>

      {/* Receipt Card */}
      <Card className="w-full max-w-sm mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time Placed</span>
            <span className="font-medium">{timePlaced}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Wait</span>
            <span className="font-medium text-amber-800">
              ~{estimatedMinutes} min{ordersAhead > 0 ? ` (${ordersAhead} order${ordersAhead === 1 ? "" : "s"} ahead)` : ""}
            </span>
          </div>
          <Separator />
          {currentOrder.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}× {item.item_name}
              </span>
              <span>{formatPrice(item.item_price_pence * item.quantity)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-amber-800">{formatPrice(currentOrder.total_pence)}</span>
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            {currentOrder.delivery_method === "delivery" ? (
              <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            <span>
              {currentOrder.delivery_method === "delivery"
                ? `Delivery to Flat ${currentOrder.flat_number ?? ""}`
                : "Collection from kitchen"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleDot className="h-4 w-4" aria-hidden="true" />
            <span className="capitalize">{currentOrder.payment_method} payment</span>
          </div>
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card className="w-full max-w-sm mb-4 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">What happens next?</h3>
          <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
            <li>Our kitchen team is preparing your order fresh 🍳</li>
            <li>
              {currentOrder.delivery_method === "delivery"
                ? "We'll bring it to your flat when it's ready 🚚"
                : "We'll let you know when it's ready to collect 📦"}
            </li>
            <li>Enjoy your breakfast! ☀️</li>
          </ol>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {currentOrder.status === "delivered" && (
        <FeedbackSection orderId={currentOrder.id} />
      )}

      <Button
        onClick={onNewOrder}
        className="bg-amber-500 hover:bg-amber-600 text-white h-12 touch-target"
        aria-label="Place another order"
      >
        Place Another Order
      </Button>
    </div>
  );
}

function FeedbackSection({ orderId }: { orderId: string }) {
  const { data: feedbackData, isLoading } = useOrderFeedback(orderId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <Card className="w-full max-w-sm mb-4">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    );
  }

  if (feedbackData?.exists && feedbackData.feedback) {
    return (
      <Card className="w-full max-w-sm mb-4 bg-amber-50 border-amber-200">
        <CardContent className="p-4 text-center">
          <p className="font-semibold text-amber-900 mb-2">Thank you for your feedback! ⭐</p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${star <= feedbackData.feedback!.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                aria-hidden="true"
              />
            ))}
          </div>
          {feedbackData.feedback.comment && (
            <p className="text-sm text-amber-800 mt-2 italic">&ldquo;{feedbackData.feedback.comment}&rdquo;</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({
        order_id: orderId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Thank you for your feedback!");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm mb-4 border-amber-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-center mb-3">How was your breakfast? 🌟</h3>
        <div className="flex justify-center gap-1 mb-4" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="touch-target p-1"
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              type="button"
            >
              <Star
                className={`h-8 w-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Any comments? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mb-3 resize-none"
          rows={3}
          aria-label="Feedback comment"
        />
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11 touch-target"
          aria-label="Submit feedback"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit Feedback"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}