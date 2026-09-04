import Link from "next/link";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FilterPill from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";

// Sample data — static placeholders for the scaffold.
const orders = [
  {
    id: "OP-1042",
    date: "03 ก.ย.",
    customer: "Nichakan T.",
    items: 3,
    total: "฿3,520",
    payment: { label: "ชำระแล้ว", tone: "accent" as const },
    shipping: { label: "Shipped", tone: "ink" as const },
    tracking: "TH482910",
  },
  {
    id: "OP-1041",
    date: "03 ก.ย.",
    customer: "Ploy S.",
    items: 1,
    total: "฿890",
    payment: { label: "รอชำระ", tone: "neutral" as const },
    shipping: { label: "New Order", tone: "neutral" as const },
    tracking: "—",
  },
  {
    id: "OP-1040",
    date: "02 ก.ย.",
    customer: "Anan K.",
    items: 2,
    total: "฿1,640",
    payment: { label: "มัดจำ", tone: "neutral" as const },
    shipping: { label: "New Order", tone: "neutral" as const },
    tracking: "—",
  },
  {
    id: "OP-1039",
    date: "02 ก.ย.",
    customer: "Warunee P.",
    items: 4,
    total: "฿5,120",
    payment: { label: "ชำระแล้ว", tone: "accent" as const },
    shipping: { label: "Shipped", tone: "ink" as const },
    tracking: "TH482887",
  },
  {
    id: "OP-1038",
    date: "01 ก.ย.",
    customer: "Kittipong R.",
    items: 1,
    total: "฿650",
    payment: { label: "ชำระแล้ว", tone: "accent" as const },
    shipping: { label: "New Order", tone: "neutral" as const },
    tracking: "—",
  },
  {
    id: "OP-1037",
    date: "31 ส.ค.",
    customer: "Suphakit W.",
    items: 2,
    total: "฿1,980",
    payment: { label: "รอชำระ", tone: "neutral" as const },
    shipping: { label: "New Order", tone: "neutral" as const },
    tracking: "—",
  },
];

export default function OrdersPage() {
  return (
    <>
      <Topbar title="Orders" actions={<Button>+ เพิ่มออร์เดอร์</Button>} />
      <div className="p-8 flex flex-col gap-3">
        <div className="flex gap-2.5">
          <FilterPill>Status ▾</FilterPill>
          <FilterPill>Date range ▾</FilterPill>
          <FilterPill>Channel ▾</FilterPill>
        </div>
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
                      {order.id}
                    </Link>
                  </Td>
                  <Td>{order.date}</Td>
                  <Td>{order.customer}</Td>
                  <Td>{order.items}</Td>
                  <Td>{order.total}</Td>
                  <Td>
                    <Badge tone={order.payment.tone}>{order.payment.label}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={order.shipping.tone}>{order.shipping.label}</Badge>
                  </Td>
                  <Td className={order.tracking === "—" ? "text-muted italic" : ""}>
                    {order.tracking}
                  </Td>
                </tr>
              ))}
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
