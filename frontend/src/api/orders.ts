import { apiFetch } from "./client";

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface CreateOrderPayload {
  items: OrderItemPayload[];
}

export interface Order {
  id: string | number;
  [key: string]: unknown;
}

export async function createOrder(items: OrderItemPayload[]): Promise<Order> {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({ items } as CreateOrderPayload),
  });
}
