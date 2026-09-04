"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatMinor, listCustomers, listOrders, type Customer, type Order } from "@/lib/api";

const PAYMENT_LABEL: Record<Order["payment_status"], { label: string; tone: "accent" | "neutral" }> = {
  paid: { label: "ชำระแล้ว", tone: "accent" },
  unpaid: { label: "รอชำระ", tone: "neutral" },
  deposit: { label: "มัดจำ", tone: "neutral" },
};

const SHIPPING_LABEL: Record<Order["shipping_status"], { label: string; tone: "ink" | "neutral" }> = {
  shipped: { label: "Shipped", tone: "ink" },
  new_order: { label: "New Order", tone: "neutral" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shippingFilter, setShippingFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");

  useEffect(() => {
    listCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    listOrders({
      shipping_status: shippingFilter || undefined,
      payment_status: paymentFilter || undefined,
      channel: channelFilter || undefined,
    })
      .then(setOrders)
      .catch((err) => setLoadError(String(err)));
  }, [shippingFilter, paymentFilter, channelFilter]);

  const customerName = useMemo(() => {
    const map = new Map(customers.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? map.get(id) ?? "—" : "Guest");
  }, [customers]);

  return (
    <>
      <Topbar
        title="Orders"
        actions={
          <Link href="/orders/new">
            <Button>+ เพิ่มออร์เดอร์</Button>
          </Link>
        }
      />
      <div className="p-8 flex flex-col gap-3">
        <div className="flex gap-2.5">
          <select
            value={shippingFilter}
            onChange={(e) => setShippingFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-muted"
          >
            <option value="">Status: all</option>
            <option value="new_order">New Order</option>
            <option value="shipped">Shipped</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-muted"
          >
            <option value="">Payment: all</option>
            <option value="unpaid">รอชำระ</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="deposit">มัดจำ</option>
          </select>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-muted"
          >
            <option value="">Channel: all</option>
            <option value="pos">POS</option>
            <option value="store">Store</option>
            <option value="online">Online</option>
          </select>
        </div>

        {loadError && (
          <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2 w-fit">
            Couldn&apos;t load orders: {loadError}
          </div>
        )}

        <Card className="pt-2 px-5 pb-5">
          <Table>
            <thead>
              <tr>
                <Th>Order ID</Th>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Payment</Th>
                <Th>Shipping</Th>
                <Th>Tracking</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <Td>
                    <Link href={`/orders/${order.id}`} className="text-accent hover:text-accent-hover">
                      {order.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </Td>
                  <Td>{new Date(order.created_at).toLocaleDateString("th-TH")}</Td>
                  <Td>{customerName(order.customer_id)}</Td>
                  <Td>{order.line_items.reduce((n, li) => n + li.qty, 0)}</Td>
                  <Td>{formatMinor(order.net_total_minor)}</Td>
                  <Td>
                    <Badge tone={PAYMENT_LABEL[order.payment_status].tone}>
                      {PAYMENT_LABEL[order.payment_status].label}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={SHIPPING_LABEL[order.shipping_status].tone}>
                      {SHIPPING_LABEL[order.shipping_status].label}
                    </Badge>
                  </Td>
                  <Td className={!order.tracking_number ? "text-muted italic" : ""}>
                    {order.tracking_number ?? "—"}
                  </Td>
                </tr>
              ))}
              {orders.length === 0 && !loadError && (
                <tr>
                  <Td colSpan={8} className="text-muted italic text-center py-6">
                    No orders match these filters.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
        <span className="text-[11px] text-muted italic">
          Shipping status auto-derives — becomes &quot;Shipped&quot; automatically once a
          tracking number is entered. No manual status field.
        </span>
      </div>
    </>
  );
}
