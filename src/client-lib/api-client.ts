import axios from "axios";
import useSWR, { mutate } from "swr";
import type { MenuItem, OrderWithItems, KitchenSettings, OrderStats, OrderFeedback, FeedbackStats } from "@/shared/models/breakfast";

export const apiClient = axios.create({
  baseURL: "/api",
});

const fetcher = <T>(url: string) => apiClient.get<T>(url).then((res) => res.data);

export function useMenu() {
  return useSWR<MenuItem[], Error>('/menu', fetcher);
}

export function useAdminMenu() {
  return useSWR<MenuItem[], Error>('/menu/admin', fetcher);
}

export function useOrders(status?: string) {
  const params = status ? `?status=${status}` : '';
  return useSWR<OrderWithItems[], Error>(`/orders${params}`, fetcher, { refreshInterval: 10000 });
}

export function useSettings() {
  return useSWR<KitchenSettings, Error>('/settings', fetcher);
}

export async function updateSettings(data: Partial<KitchenSettings>) {
  try {
    return await apiClient.patch<KitchenSettings>('/settings', data, {
      headers: { 'x-staff-pin': '2024' },
    }).then(r => r.data);
  } finally {
    await mutate('/settings');
  }
}

export function useOrderStats() {
  return useSWR<OrderStats, Error>('/orders/stats', fetcher, { refreshInterval: 30000 });
}

export function useOrder(id: string | null) {
  return useSWR<OrderWithItems, Error>(id ? `/orders/${id}` : null, fetcher, { refreshInterval: 15000 });
}

export function useOrdersAhead(orderId: string | null) {
  return useSWR<{ count: number }>(
    orderId ? `/orders/ahead/${orderId}` : null,
    async (url: string) => {
      // We'll compute this client-side from the orders list
      // Fetch all pending/preparing orders
      const res = await apiClient.get<OrderWithItems[]>('/orders?status=pending,preparing');
      const orders = res.data;
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) return { count: 0 };
      // Count orders created before this one
      const ahead = orders.filter(o =>
        o.id !== orderId &&
        new Date(o.created_at).getTime() < new Date(currentOrder.created_at).getTime()
      ).length;
      return { count: ahead };
    },
    { refreshInterval: 15000 }
  );
}

export async function createOrder(data: {
  resident_name: string;
  flat_number?: string;
  mobile_number?: string;
  address?: string;
  delivery_method: string;
  notes?: string;
  payment_method: string;
  items: Array<{ menu_item_id: string; quantity: number }>;
  extras?: Array<{ menu_item_id: string; quantity: number }>;
  scheduled_for?: string;
}) {
  try {
    return await apiClient.post<OrderWithItems>('/orders', data).then(r => r.data);
  } finally {
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/orders'),
      undefined,
      { revalidate: true }
    );
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    return await apiClient.patch<{ success: boolean }>(`/orders/${orderId}/status`, { status }).then(r => r.data);
  } finally {
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/orders'),
      undefined,
      { revalidate: true }
    );
  }
}

export async function createMenuItem(data: Partial<MenuItem>) {
  try {
    return await apiClient.post<MenuItem>('/menu/admin', data).then(r => r.data);
  } finally {
    await mutate('/menu/admin');
    await mutate('/menu');
  }
}

export async function updateMenuItem(id: string, data: Partial<MenuItem>) {
  try {
    return await apiClient.patch<MenuItem>(`/menu/admin/${id}`, data).then(r => r.data);
  } finally {
    await mutate('/menu/admin');
    await mutate('/menu');
  }
}

export async function deleteMenuItem(id: string) {
  try {
    return await apiClient.delete(`/menu/admin/${id}`).then(r => r.data);
  } finally {
    await mutate('/menu/admin');
    await mutate('/menu');
  }
}

export function useFeedbackStats() {
  return useSWR<FeedbackStats, Error>('/feedback', fetcher, { refreshInterval: 30000 });
}

export function useOrderFeedback(orderId: string | null) {
  return useSWR<{ exists: boolean; feedback?: OrderFeedback }>(
    orderId ? `/feedback/${orderId}` : null,
    fetcher
  );
}

export async function submitFeedback(data: { order_id: string; rating: number; comment?: string }) {
  try {
    return await apiClient.post<OrderFeedback>('/feedback', data).then(r => r.data);
  } finally {
    await mutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('/feedback'),
      undefined,
      { revalidate: true }
    );
  }
}