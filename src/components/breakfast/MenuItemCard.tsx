"use client";

import type { MenuItem } from "@/shared/models/breakfast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Heart } from "lucide-react";
import { formatPrice } from "./utils";

export function MenuItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
  disabled,
  isFavourite,
  onToggleFavourite,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  disabled?: boolean;
  isFavourite?: boolean;
  onToggleFavourite?: () => void;
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
            {onToggleFavourite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavourite();
                }}
                className={`absolute top-1 right-1 p-1.5 rounded-full transition-colors ${
                  isFavourite
                    ? "bg-red-500 text-white"
                    : "bg-white/80 text-gray-400 hover:text-red-500"
                }`}
                aria-label={isFavourite ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
              >
                <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
              </button>
            )}
          </div>
        )}
        <CardContent className="p-3 flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <div>
              <h3 className="font-semibold text-base leading-tight">{item.name}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
            {!item.image_url && onToggleFavourite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavourite();
                }}
                className={`p-1.5 rounded-full transition-colors shrink-0 ${
                  isFavourite
                    ? "text-red-500"
                    : "text-gray-300 hover:text-red-500"
                }`}
                aria-label={isFavourite ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
              >
                <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
              </button>
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
