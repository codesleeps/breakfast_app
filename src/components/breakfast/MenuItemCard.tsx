"use client";

import type { MenuItem } from "@/shared/models/breakfast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { formatPrice } from "./utils";

export function MenuItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
  disabled,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-amber-100 transition-shadow hover:shadow-md">
      <div className="flex flex-row">
        {item.image_url && (
          <div className="relative w-28 min-h-28 shrink-0 sm:w-32 sm:min-h-32 self-stretch">
            <img
              src={item.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className="p-3 flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            <p className="text-lg font-bold text-white bg-amber-600 px-3 py-1 rounded-full">
              {formatPrice(item.price_pence)}
            </p>
            <div className="shrink-0">
              {disabled ? (
                <Button
                  size="icon"
                  className="h-11 w-11 rounded-full bg-gray-300 text-gray-500 cursor-not-allowed touch-target"
                  disabled
                  aria-label={`${item.name} - kitchen is closed`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : quantity > 0 ? (
                <div className="flex items-center gap-1 bg-amber-100 rounded-full px-1 py-0.5 border-2 border-amber-300">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full hover:bg-amber-200 touch-target"
                    onClick={onRemove}
                    aria-label={`Remove one ${item.name} from cart`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-base w-6 text-center text-amber-900" aria-label={`${quantity} in cart`}>{quantity}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full hover:bg-amber-200 touch-target"
                    onClick={onAdd}
                    aria-label={`Add another ${item.name} to cart`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  className="h-11 w-11 rounded-full bg-amber-500 hover:bg-amber-600 text-white touch-target"
                  onClick={onAdd}
                  aria-label={`Add ${item.name} to cart, ${formatPrice(item.price_pence)}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
