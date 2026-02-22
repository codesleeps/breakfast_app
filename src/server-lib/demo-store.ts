import type { OrderWithItems } from '@/shared/models/breakfast';

// Global in-memory store for demo orders (persists across hot reloads)
const globalForOrders = globalThis as unknown as {
  demoOrders: OrderWithItems[] | undefined;
};

export const demoOrders: OrderWithItems[] = globalForOrders.demoOrders ?? [];
globalForOrders.demoOrders = demoOrders;