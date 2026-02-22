"use client";

import { useState, useCallback } from "react";
import {
  useAdminMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/client-lib/api-client";
import type { MenuItem } from "@/shared/models/breakfast";
import { StaffAuthGate } from "@/components/StaffAuthGate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ChefHat,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { KitchenSettingsPanel } from "@/components/breakfast/KitchenSettingsPanel";

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Hot: "bg-red-100 text-red-800 border-red-200",
  Light: "bg-green-100 text-green-800 border-green-200",
  Drinks: "bg-blue-100 text-blue-800 border-blue-200",
};

interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  available: boolean;
  sort_order: string;
}

const EMPTY_FORM: MenuItemFormData = {
  name: "",
  description: "",
  price: "",
  category: "Hot",
  image_url: "",
  available: true,
  sort_order: "0",
};

function menuItemToForm(item: MenuItem): MenuItemFormData {
  return {
    name: item.name,
    description: item.description ?? "",
    price: (item.price_pence / 100).toFixed(2),
    category: item.category,
    image_url: item.image_url ?? "",
    available: item.available,
    sort_order: String(item.sort_order),
  };
}

export default function ManageMenuPage() {
  return (
    <StaffAuthGate>
      <MenuManagementContent />
    </StaffAuthGate>
  );
}

function MenuManagementContent() {
  const { data: items, isLoading, error } = useAdminMenu();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<MenuItem | null>(null);

  const openAddDialog = useCallback(() => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setForm(menuItemToForm(item));
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Price must be greater than £0.00");
      return;
    }

    const pricePence = Math.round(priceNum * 100);
    const sortOrder = parseInt(form.sort_order, 10) || 0;

    setSaving(true);
    try {
      const payload: Partial<MenuItem> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_pence: pricePence,
        category: form.category,
        image_url: form.image_url.trim() || null,
        available: form.available,
        sort_order: sortOrder,
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
        toast.success(`"${form.name}" updated`);
      } else {
        await createMenuItem(payload);
        toast.success(`"${form.name}" created`);
      }

      setDialogOpen(false);
    } catch {
      toast.error(editingItem ? "Failed to update item" : "Failed to create item");
    } finally {
      setSaving(false);
    }
  }, [form, editingItem]);

  const handleToggleAvailable = useCallback(
    async (item: MenuItem) => {
      try {
        await updateMenuItem(item.id, { available: !item.available });
        toast.success(
          `"${item.name}" ${!item.available ? "enabled" : "disabled"}`
        );
      } catch {
        toast.error("Failed to toggle availability");
      }
    },
    []
  );

  const handleDelete = useCallback(async () => {
    if (!confirmDeleteItem) return;
    setDeletingId(confirmDeleteItem.id);
    try {
      await deleteMenuItem(confirmDeleteItem.id);
      toast.success(`"${confirmDeleteItem.name}" deleted`);
      setConfirmDeleteItem(null);
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setDeletingId(null);
    }
  }, [confirmDeleteItem]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold">Menu Management</h1>
            <p className="text-sm text-muted-foreground">
              {items ? `${items.length} items` : "Loading..."}
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-700 flex items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load menu items.</p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !error && items && items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No menu items yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first menu item to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!isLoading && items && items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={!item.available ? "opacity-50" : ""}
                  >
                    <TableCell>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={CATEGORY_COLORS[item.category] ?? ""}
                      >
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatPrice(item.price_pence)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => handleToggleAvailable(item)}
                      />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {item.sort_order}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDeleteItem(item)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the details for this menu item."
                : "Fill in the details for the new menu item."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name *</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Full English"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="e.g. Eggs, bacon, sausage, beans, toast"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price (£) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="2.50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-category">Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm((f) => ({ ...f, category: val }))
                  }
                >
                  <SelectTrigger id="item-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hot">Hot</SelectItem>
                    <SelectItem value="Light">Light</SelectItem>
                    <SelectItem value="Drinks">Drinks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image">Image URL</Label>
              <Input
                id="item-image"
                value={form.image_url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, image_url: e.target.value }))
                }
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-sort">Sort Order</Label>
                <Input
                  id="item-sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sort_order: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="item-available"
                  checked={form.available}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, available: checked }))
                  }
                />
                <Label htmlFor="item-available">Available</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : editingItem ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteItem !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteItem(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{confirmDeleteItem?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteItem(null)}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deletingId !== null}
            >
              {deletingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kitchen Settings */}
      <div className="mt-8">
        <KitchenSettingsPanel />
      </div>
    </div>
  );
}
