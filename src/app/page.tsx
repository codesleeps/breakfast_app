"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useMenu, useSettings, createOrder } from "@/client-lib/api-client";
import { getAuthClient } from "@/client-lib/auth-client";
import type { MenuItem, CartItem, CartExtra, OrderWithItems, DietaryFlag } from "@/shared/models/breakfast";
import { DIETARY_FLAGS } from "@/shared/models/breakfast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ShoppingCart,
  Flame,
  Leaf,
  Coffee,
  Truck,
  Package,
  Plus,
  Minus,
  Sparkles,
  Clock,
  User,
  Save,
  Heart,
} from "lucide-react";
import { ServiceStatus } from "@/components/breakfast/ServiceStatus";
import { KitchenClosedOverlay } from "@/components/breakfast/KitchenClosedOverlay";
import { MenuItemCard } from "@/components/breakfast/MenuItemCard";
import { OrderSuccess } from "@/components/breakfast/OrderSuccess";
import { formatPrice, formatHour, isKitchenCurrentlyOpen } from "@/components/breakfast/utils";
import { Switch } from "@/components/ui/switch";

const PROFILE_STORAGE_KEY = "breakfast_profile";
const FAVOURITES_STORAGE_KEY = "breakfast_favourites";

interface SavedProfile {
  residentName: string;
  flatNumber: string;
  mobileNumber: string;
  address: string;
  dietaryFlags: DietaryFlag[];
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Hot":
      return <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />;
    case "Light":
      return <Leaf className="h-4 w-4 text-green-500" aria-hidden="true" />;
    case "Drinks":
      return <Coffee className="h-4 w-4 text-amber-800" aria-hidden="true" />;
    case "Extras":
      return <Sparkles className="h-4 w-4 text-purple-500" aria-hidden="true" />;
    default:
      return null;
  }
}

function generateTimeSlots(): Array<{ value: string; label: string }> {
  const slots: Array<{ value: string; label: string }> = [];
  const now = new Date();
  
  // Generate slots for today and tomorrow
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    
    const dayLabel = dayOffset === 0 ? "Today" : "Tomorrow";
    const dateStr = date.toISOString().split('T')[0];
    
    // Service hours: 8am to 1pm (13:00), slots every 30 minutes
    for (let hour = 8; hour < 13; hour++) {
      for (const minute of [0, 30]) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Skip slots that are in the past (need at least 30 min notice)
        if (slotTime.getTime() < now.getTime() + 30 * 60 * 1000) continue;
        
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = slotTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        slots.push({
          value: `${dateStr}T${timeStr}`,
          label: `${dayLabel} at ${displayTime}`,
        });
      }
    }
  }
  
  return slots;
}

export default function HomePage() {
  const { data: menuItems, isLoading, error } = useMenu();
  const { data: settings } = useSettings();
  const { data: session } = getAuthClient();
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [extras, setExtras] = useState<Map<string, CartExtra>>(new Map()); // Per-order extras
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<OrderWithItems | null>(null);

  const [residentName, setResidentName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "collection">("collection");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "donation">("cash");
  const [notes, setNotes] = useState("");
  const [dietaryFlags, setDietaryFlags] = useState<DietaryFlag[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledSlot, setScheduledSlot] = useState("");
  const [saveProfile, setSaveProfile] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  // Load saved profile and favourites on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const profile: SavedProfile = JSON.parse(saved);
        setResidentName(profile.residentName || "");
        setFlatNumber(profile.flatNumber || "");
        setMobileNumber(profile.mobileNumber || "");
        setAddress(profile.address || "");
        setDietaryFlags(profile.dietaryFlags || []);
        setNamePreFilled(true); // Prevent session override
      }
    } catch {
      // Ignore parse errors
    }
    
    try {
      const savedFavourites = localStorage.getItem(FAVOURITES_STORAGE_KEY);
      if (savedFavourites) {
        setFavouriteIds(new Set(JSON.parse(savedFavourites)));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Pre-fill name from session (only if no saved profile)
  const [namePreFilled, setNamePreFilled] = useState(false);
  useEffect(() => {
    if (session?.user?.name && !namePreFilled && !residentName) {
      setResidentName(session.user.name);
      setNamePreFilled(true);
    }
  }, [session, namePreFilled, residentName]);

  const kitchenOpen = isKitchenCurrentlyOpen(settings);

  // Re-check kitchen status every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const addToCart = useCallback((item: MenuItem) => {
    // Don't add extras to main cart - they go in extras map
    if (item.is_extra) {
      setExtras((prev) => {
        const next = new Map(prev);
        const existing = next.get(item.id);
        if (existing) {
          next.set(item.id, { ...existing, quantity: existing.quantity + 1 });
        } else {
          next.set(item.id, { menuItem: item, quantity: 1 });
        }
        return next;
      });
      return;
    }
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      if (existing) {
        next.set(item.id, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(item.id, { menuItem: item, quantity: 1 });
      }
      return next;
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    // Check if it's an extra
    if (extras.has(itemId)) {
      setExtras((prev) => {
        const next = new Map(prev);
        const existing = next.get(itemId);
        if (existing && existing.quantity > 1) {
          next.set(itemId, { ...existing, quantity: existing.quantity - 1 });
        } else {
          next.delete(itemId);
        }
        return next;
      });
      return;
    }
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId);
      if (existing && existing.quantity > 1) {
        next.set(itemId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, [extras]);

  const toggleFavourite = useCallback((itemId: string) => {
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      // Save to localStorage
      localStorage.setItem(FAVOURITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const cartItems = useMemo(() => Array.from(cart.values()), [cart]);
  const extrasItems = useMemo(() => Array.from(extras.values()), [extras]);
  const cartCount = useMemo(() => cartItems.reduce((sum, ci) => sum + ci.quantity, 0), [cartItems]);
  const extrasCount = useMemo(() => extrasItems.reduce((sum, ex) => sum + ex.quantity, 0), [extrasItems]);
  const cartTotal = useMemo(() => {
    const itemsTotal = cartItems.reduce((sum, ci) => sum + ci.menuItem.price_pence * ci.quantity, 0);
    const extrasTotal = extrasItems.reduce((sum, ex) => sum + ex.menuItem.price_pence * ex.quantity, 0);
    return itemsTotal + extrasTotal;
  }, [cartItems, extrasItems]);

  // Separate main menu items from extras
  const { mainMenuItems, extrasMenuItems } = useMemo(() => {
    if (!menuItems) return { mainMenuItems: [], extrasMenuItems: [] };
    const main: MenuItem[] = [];
    const extraItems: MenuItem[] = [];
    for (const item of menuItems) {
      if (item.is_extra) {
        extraItems.push(item);
      } else {
        main.push(item);
      }
    }
    return { mainMenuItems: main, extrasMenuItems: extraItems };
  }, [menuItems]);

  const groupedMenu = useMemo(() => {
    if (!mainMenuItems) return new Map<string, MenuItem[]>();
    const groups = new Map<string, MenuItem[]>();
    for (const item of mainMenuItems) {
      const existing = groups.get(item.category);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(item.category, [item]);
      }
    }
    return groups;
  }, [mainMenuItems]);

  const handleSubmitOrder = async () => {
    if (!residentName.trim()) { toast.error("Please enter your name"); return; }
    if (!mobileNumber.trim()) { toast.error("Please enter your mobile number"); return; }
    if (deliveryMethod === "delivery" && !flatNumber.trim()) { toast.error("Please enter your flat/room number for delivery"); return; }
    if (deliveryMethod === "delivery" && !address.trim()) { toast.error("Please enter your address for delivery"); return; }
    if (cartItems.length === 0) { toast.error("Your cart is empty"); return; }
    if (isScheduled && !scheduledSlot) { toast.error("Please select a time slot for your scheduled order"); return; }

    setSubmitting(true);
    try {
      // Calculate scheduled_for timestamp
      let scheduledFor: string | undefined;
      if (isScheduled && scheduledSlot) {
        const [datePart, timePart] = scheduledSlot.split('T');
        if (datePart && timePart) {
          scheduledFor = new Date(scheduledSlot).toISOString();
        }
      }

      const order = await createOrder({
        resident_name: residentName.trim(),
        flat_number: flatNumber.trim() || undefined,
        mobile_number: mobileNumber.trim() || undefined,
        address: address.trim() || undefined,
        delivery_method: deliveryMethod,
        notes: notes.trim() || undefined,
        dietary_flags: dietaryFlags.length > 0 ? dietaryFlags : undefined,
        payment_method: paymentMethod,
        items: cartItems.map((ci) => ({ menu_item_id: ci.menuItem.id, quantity: ci.quantity })),
        extras: extrasItems.map((ex) => ({ menu_item_id: ex.menuItem.id, quantity: ex.quantity })),
        scheduled_for: scheduledFor,
      });

      // Save profile if enabled
      if (saveProfile) {
        const profile: SavedProfile = {
          residentName: residentName.trim(),
          flatNumber: flatNumber.trim(),
          mobileNumber: mobileNumber.trim(),
          address: address.trim(),
          dietaryFlags,
        };
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      }

      setSuccessOrder(order);
      setSheetOpen(false);
      setCart(new Map());
      setExtras(new Map());
      // Keep profile fields populated for next order (name, flat, mobile, address, dietary flags)
      // Only reset per-order fields
      setDeliveryMethod("collection");
      setPaymentMethod("cash");
      setNotes("");
      setIsScheduled(false);
      setScheduledSlot("");
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <OrderSuccess order={successOrder} onNewOrder={() => setSuccessOrder(null)} />
      </div>
    );
  }

  // Display the actual breakfast hours (8am-1pm) in the UI
  const startLabel = "8am";
  const endLabel = "1pm";

  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">☀️ Good Morning!</h1>
        <p className="text-muted-foreground text-sm mb-2">Aston Breakfast Club · Birmingham</p>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <ServiceStatus settings={settings} />
          <Badge variant="outline" className="text-xs border-amber-300 text-amber-800">
            Serving {startLabel} – {endLabel}
          </Badge>
        </div>
      </div>

      {settings && !kitchenOpen && <KitchenClosedOverlay settings={settings} />}

      {isLoading && (
        <div className="space-y-4" aria-label="Loading menu">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center text-red-700">
            <p role="alert">Failed to load menu. Please refresh the page.</p>
          </CardContent>
        </Card>
      )}

      {menuItems && (
        <div className="space-y-6" role="list" aria-label="Menu categories">
          {/* Favourites Section */}
          {favouriteIds.size > 0 && mainMenuItems.filter(item => favouriteIds.has(item.id)).length > 0 && (
            <section aria-label="Your Favourites">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                <h2 className="text-lg font-bold">Your Favourites</h2>
              </div>
              <div className="space-y-3" role="list">
                {mainMenuItems
                  .filter(item => favouriteIds.has(item.id))
                  .map((item) => (
                    <MenuItemCard
                      key={`fav-${item.id}`}
                      item={item}
                      quantity={cart.get(item.id)?.quantity ?? 0}
                      onAdd={() => addToCart(item)}
                      onRemove={() => removeFromCart(item.id)}
                      disabled={!kitchenOpen}
                      isFavourite={true}
                      onToggleFavourite={() => toggleFavourite(item.id)}
                    />
                  ))}
              </div>
            </section>
          )}
          {Array.from(groupedMenu.entries()).map(([category, items]) => (
            <section key={category} aria-label={`${category} items`}>
              <div className="flex items-center gap-2 mb-3">
                {getCategoryIcon(category)}
                <h2 className="text-lg font-bold">{category}</h2>
                <Badge variant="secondary" className="text-xs">{items.length} {items.length === 1 ? "item" : "items"}</Badge>
              </div>
              <div className="space-y-3" role="list">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={cart.get(item.id)?.quantity ?? 0}
                    onAdd={() => addToCart(item)}
                    onRemove={() => removeFromCart(item.id)}
                    disabled={!kitchenOpen}
                    isFavourite={favouriteIds.has(item.id)}
                    onToggleFavourite={() => toggleFavourite(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
          {/* Extras Section */}
          {extrasMenuItems.length > 0 && (
            <section aria-label="Extras">
              <div className="flex items-center gap-2 mb-3">
                {getCategoryIcon("Extras")}
                <h2 className="text-lg font-bold">Extras</h2>
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">{extrasMenuItems.length} add-ons</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="list">
                {extrasMenuItems.map((item) => {
                  const qty = extras.get(item.id)?.quantity ?? 0;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        qty > 0
                          ? "border-purple-500 bg-purple-100 shadow-md"
                          : "border-gray-300 bg-white hover:border-purple-400 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg text-gray-900">{item.name}</span>
                        {qty > 0 && (
                          <Badge variant="secondary" className="h-7 w-7 flex items-center justify-center rounded-full text-base font-bold bg-purple-600 text-white p-0">
                            {qty}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-1">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900">{formatPrice(item.price_pence)}</span>
                        <div className="flex items-center gap-1">
                          {qty > 0 && (
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 rounded-full border-2 border-purple-400 hover:bg-purple-200"
                              onClick={() => removeFromCart(item.id)}
                              disabled={!kitchenOpen}
                              aria-label={`Remove ${item.name}`}
                            >
                              <Minus className="h-5 w-5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            className="h-9 w-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => addToCart(item)}
                            disabled={!kitchenOpen}
                            aria-label={`Add ${item.name}`}
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Floating Cart Bar */}
      {cartCount > 0 && kitchenOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white to-transparent pt-8" aria-live="polite">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                className="w-full max-w-2xl mx-auto flex items-center justify-between h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg text-base touch-target"
                size="lg"
                aria-label={`View cart: ${cartCount + extrasCount} items, total ${formatPrice(cartTotal)}`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                  <span className="font-bold">{cartCount + extrasCount} {(cartCount + extrasCount) === 1 ? "item" : "items"}</span>
                </div>
                <span className="font-bold text-lg">{formatPrice(cartTotal)}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="text-xl">Your Order</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 mt-4 pb-6">
                {/* Items */}
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">Items</h3>
                  <div className="space-y-2">
                    {cartItems.map((ci) => (
                      <div key={ci.menuItem.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="h-7 w-7 flex items-center justify-center rounded-full text-sm font-bold">{ci.quantity}</Badge>
                          <span className="font-medium">{ci.menuItem.name}</span>
                        </div>
                        <span className="font-semibold text-amber-800">{formatPrice(ci.menuItem.price_pence * ci.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Extras */}
                  {extrasItems.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <h4 className="font-semibold text-sm text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Extras
                      </h4>
                      <div className="space-y-2">
                        {extrasItems.map((ex) => (
                          <div key={ex.menuItem.id} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold bg-purple-100 text-purple-700">{ex.quantity}</Badge>
                              <span className="text-sm">{ex.menuItem.name}</span>
                            </div>
                            <span className="font-semibold text-purple-700 text-sm">{formatPrice(ex.menuItem.price_pence * ex.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  <Separator className="mt-2" />
                  <div className="flex justify-between py-3 font-bold text-lg">
                    <span>Total</span>
                    <span className="text-amber-800">{formatPrice(cartTotal)}</span>
                  </div>
                </div>
                <Separator />
                {/* Name */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Your Details</h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="save-profile"
                        checked={saveProfile}
                        onCheckedChange={setSaveProfile}
                        className="data-[state=checked]:bg-amber-500"
                      />
                      <Label htmlFor="save-profile" className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                        <Save className="h-3 w-3" />
                        Remember me
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resident-name">Name <span className="text-red-500">*</span></Label>
                    <Input id="resident-name" placeholder="Enter your name" value={residentName} onChange={(e) => setResidentName(e.target.value)} className="border-amber-200 focus-visible:ring-amber-400 h-12" aria-required="true" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile-number">Mobile Number <span className="text-red-500">*</span></Label>
                    <Input id="mobile-number" type="tel" placeholder="e.g. 07123 456789" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="border-amber-200 focus-visible:ring-amber-400 h-12" aria-required="true" />
                  </div>
                </div>
                <Separator />
                {/* Delivery */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">How would you like your order?</h3>
                  <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as "delivery" | "collection")} className="space-y-2" aria-label="Delivery method">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors min-h-[48px]">
                      <RadioGroupItem value="collection" id="collection" className="h-5 w-5" />
                      <Label htmlFor="collection" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Package className="h-4 w-4 text-amber-600" aria-hidden="true" />I&apos;ll collect from the kitchen
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors min-h-[48px]">
                      <RadioGroupItem value="delivery" id="delivery" className="h-5 w-5" />
                      <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Truck className="h-4 w-4 text-amber-600" aria-hidden="true" />Deliver to my flat
                      </Label>
                    </div>
                  </RadioGroup>
                  {deliveryMethod === "delivery" && (
                    <div className="space-y-3 pl-1">
                      <div className="space-y-2">
                        <Label htmlFor="flat-number">Flat / Room Number <span className="text-red-500">*</span></Label>
                        <Input id="flat-number" placeholder="e.g. Flat 12" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} className="border-amber-200 focus-visible:ring-amber-400 h-12" aria-required="true" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address <span className="text-red-500">*</span></Label>
                        <Textarea id="address" placeholder="e.g. 123 Birmingham Road, B1 1AA" value={address} onChange={(e) => setAddress(e.target.value)} className="border-amber-200 focus-visible:ring-amber-400 resize-none" rows={2} aria-required="true" />
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
                {/* Payment */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Payment</h3>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "cash" | "card" | "donation")} className="space-y-2" aria-label="Payment method">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors min-h-[48px]">
                      <RadioGroupItem value="cash" id="cash" className="h-5 w-5" />
                      <Label htmlFor="cash" className="cursor-pointer flex-1">💷 Cash</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors min-h-[48px]">
                      <RadioGroupItem value="card" id="card" className="h-5 w-5" />
                      <Label htmlFor="card" className="cursor-pointer flex-1">💳 Card</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors min-h-[48px]">
                      <RadioGroupItem value="donation" id="donation" className="h-5 w-5" />
                      <Label htmlFor="donation" className="cursor-pointer flex-1">🤝 Donation Box</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Separator />
                {/* Scheduling */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">When do you want it?</h3>
                  <RadioGroup value={isScheduled ? "scheduled" : "now"} onValueChange={(v) => setIsScheduled(v === "scheduled")} className="space-y-2" aria-label="Order timing">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors min-h-[48px]">
                      <RadioGroupItem value="now" id="order-now" className="h-5 w-5" />
                      <Label htmlFor="order-now" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Sparkles className="h-4 w-4 text-amber-600" aria-hidden="true" />As soon as possible
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors min-h-[48px]">
                      <RadioGroupItem value="scheduled" id="order-scheduled" className="h-5 w-5" />
                      <Label htmlFor="order-scheduled" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />Schedule for later
                      </Label>
                    </div>
                  </RadioGroup>
                  {isScheduled && (
                    <div className="space-y-3 pl-1">
                      <Label htmlFor="scheduled-slot">Select a time slot <span className="text-red-500">*</span></Label>
                      <select
                        id="scheduled-slot"
                        value={scheduledSlot}
                        onChange={(e) => setScheduledSlot(e.target.value)}
                        className="w-full h-12 px-3 rounded-md border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-required="true"
                      >
                        <option value="">Choose a time...</option>
                        {generateTimeSlots().map((slot) => (
                          <option key={slot.value} value={slot.value}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Pre-orders are prepared fresh for your selected time slot
                      </p>
                    </div>
                  )}
                </div>
                <Separator />
                {/* Dietary Requirements */}
                <div className="space-y-3">
                  <Label>Dietary Requirements (optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIETARY_FLAGS.map((flag) => {
                      const isSelected = dietaryFlags.includes(flag.value);
                      return (
                        <button
                          key={flag.value}
                          type="button"
                          onClick={() => {
                            setDietaryFlags((prev) =>
                              isSelected
                                ? prev.filter((f) => f !== flag.value)
                                : [...prev, flag.value]
                            );
                          }}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                            isSelected
                              ? flag.alertLevel === 'warning'
                                ? 'border-red-400 bg-red-50 text-red-800'
                                : 'border-amber-400 bg-amber-50 text-amber-800'
                              : 'border-gray-200 bg-white hover:border-amber-200'
                          }`}
                        >
                          <span className="text-lg">{flag.icon}</span>
                          <span className="font-medium">{flag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {dietaryFlags.some(f => ['nut_allergy', 'gluten_free', 'dairy_free'].includes(f)) && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <span>⚠️</span>
                      Kitchen staff will be alerted about allergy requirements
                    </p>
                  )}
                </div>
                <Separator />
                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Special Notes (optional)</Label>
                  <Textarea id="notes" placeholder="Any other preferences or special requests..." value={notes} onChange={(e) => setNotes(e.target.value)} className="border-amber-200 focus-visible:ring-amber-400 resize-none" rows={3} />
                </div>
                {/* Submit */}
                <Button onClick={handleSubmitOrder} disabled={submitting} className="w-full h-14 text-lg font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white touch-target" size="lg" aria-label={submitting ? "Placing order" : `Place order for ${formatPrice(cartTotal)}`}>
                  {submitting ? "Placing Order..." : `Place Order · ${formatPrice(cartTotal)}`}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
