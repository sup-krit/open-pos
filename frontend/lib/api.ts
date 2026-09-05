// Thin fetch client for the FastAPI backend. Base URL comes from
// NEXT_PUBLIC_API_URL (see .env.local / repo-root .env.example).
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (session) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Shapes (mirrors backend/app/schemas/*.py) -----------------------------

export type Product = {
  id: string;
  sku: string;
  name: string;
  group_name: string | null;
  variant_attribute: string | null;
  lot: string | null;
  cost_minor: number;
  price_minor: number;
  margin_pct: number;
  profit_minor: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
  vendor: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type OrderLineItemInput = {
  product_id: string;
  qty: number;
  unit_price_minor: number;
};

export type OrderCreate = {
  channel: string;
  customer_id?: string | null;
  shipping_cost_minor: number;
  shipping_type: string;
  payment_method: "qr" | "card";
  payment_status: "unpaid" | "paid" | "deposit";
  coupon_code?: string | null;
  line_items: OrderLineItemInput[];
};

export type OrderLineItemRead = OrderLineItemInput & { id: string };

export type Order = {
  id: string;
  created_at: string;
  channel: string;
  customer_id: string | null;
  subtotal_minor: number;
  shipping_cost_minor: number;
  discount_amount_minor: number;
  net_total_minor: number;
  promotion_id: string | null;
  shipping_type: string;
  shipping_status: "new_order" | "shipped";
  payment_method: "qr" | "card";
  payment_status: "unpaid" | "paid" | "deposit";
  tracking_number: string | null;
  checkout_token: string | null;
  checkout_token_expires_at: string | null;
  line_items: OrderLineItemRead[];
};

export type EvaluateCartLine = {
  product_id: string;
  sku: string;
  variant_attribute: string | null;
  qty: number;
  unit_price_minor: number;
};

export type AppliedPromotion = {
  promotion_id: string;
  name: string;
  discount_minor: number;
  reason: string;
};

export type PromotionResult = {
  applied_promotions: AppliedPromotion[];
  total_discount_minor: number;
  issued_reward_coupon_code: string | null;
};

export type Promotion = {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  coupon_code: string | null;
  manual_selectable: boolean;
  auto_apply: boolean;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  social_handle: string | null;
  tag: string | null;
  pdpa_consent: boolean;
  address_subdistrict: string | null;
  address_district: string | null;
  address_province: string | null;
  total_orders: number;
  total_spent_minor: number;
};

export type OrderUpdate = {
  tracking_number?: string | null;
  payment_status?: "unpaid" | "paid" | "deposit";
};

// --- Calls -------------------------------------------------------------

export function listProducts(): Promise<Product[]> {
  return request<Product[]>("/api/products");
}

export function listCustomers(): Promise<Customer[]> {
  return request<Customer[]>("/api/customers");
}

export function listOrders(params?: {
  shipping_status?: string;
  payment_status?: string;
  channel?: string;
}): Promise<Order[]> {
  const qs = new URLSearchParams();
  if (params?.shipping_status) qs.set("shipping_status", params.shipping_status);
  if (params?.payment_status) qs.set("payment_status", params.payment_status);
  if (params?.channel) qs.set("channel", params.channel);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return request<Order[]>(`/api/orders${suffix}`);
}

export function getOrder(id: string): Promise<Order> {
  return request<Order>(`/api/orders/${id}`);
}

export function updateOrder(id: string, body: OrderUpdate): Promise<Order> {
  return request<Order>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function evaluatePromotions(body: {
  cart_items: EvaluateCartLine[];
  customer_id?: string | null;
  coupon_code?: string | null;
}): Promise<PromotionResult> {
  return request<PromotionResult>("/api/promotions/evaluate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listPromotions(): Promise<Promotion[]> {
  return request<Promotion[]>("/api/promotions");
}

export function createOrder(body: OrderCreate): Promise<Order> {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// --- Formatting ----------------------------------------------------------

export function formatMinor(minor: number): string {
  return `฿${(minor / 100).toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
