export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price_pence: number;
  category: string;
  image_url: string | null;
  available: boolean;
  sort_order: number;
  is_extra?: boolean;  // true for extras/add-ons
}

export interface Order {
  id: string;
  resident_name: string;
  flat_number: string | null;
  mobile_number: string | null;
  delivery_method: 'delivery' | 'collection';
  notes: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_method: 'cash' | 'card' | 'donation';
  total_pence: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  item_name: string;
  item_price_pence: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  extras?: OrderExtra[];  // Per-order extras
}

export interface OrderExtra {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  item_name: string;
  item_price_pence: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface CartExtra {
  menuItem: MenuItem;
  quantity: number;
}

export interface KitchenSettings {
  service_days: string[];
  service_start_hour: number;
  service_end_hour: number;
}

export interface OrderStats {
  total_orders: number;
  total_revenue_pence: number;
  orders_by_status: Record<string, number>;
  orders_by_delivery: Record<string, number>;
  orders_by_payment: Record<string, number>;
  popular_items: Array<{ item_name: string; total_quantity: number }>;
  orders_by_hour: Array<{ hour: number; count: number }>;
}

export interface OrderFeedback {
  id: string;
  order_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface FeedbackStats {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  recent_feedback: Array<OrderFeedback & { resident_name: string; items: string }>;
}