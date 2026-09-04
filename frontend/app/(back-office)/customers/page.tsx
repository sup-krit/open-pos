import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FilterPill from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";

// Sample data — static placeholders for the scaffold.
const customers = [
  {
    name: "Nichakan T.",
    phone: "081-234-5678",
    instagram: "@nichakan.t",
    tag: "VIP",
    orders: 14,
    spent: "฿48,200",
    consent: true,
  },
  {
    name: "Ploy S.",
    phone: "082-345-6789",
    instagram: "@ploy.sirichai",
    tag: null,
    orders: 2,
    spent: "฿1,540",
    consent: true,
  },
  {
    name: "Anan K.",
    phone: "089-456-7890",
    instagram: null,
    tag: null,
    orders: 1,
    spent: "฿1,640",
    consent: true,
  },
  {
    name: "Warunee P.",
    phone: "061-567-8901",
    instagram: "@warunee.p",
    tag: "VIP",
    orders: 9,
    spent: "฿32,900",
    consent: true,
  },
  {
    name: "Kittipong R.",
    phone: "092-678-9012",
    instagram: null,
    tag: null,
    orders: 1,
    spent: "฿650",
    consent: false,
  },
];

const recentOrders = [
  { id: "OP-1042", total: "฿3,520", date: "03 ก.ย." },
  { id: "OP-0998", total: "฿1,890", date: "21 ส.ค." },
  { id: "OP-0951", total: "฿2,410", date: "05 ส.ค." },
];

export default function CustomersPage() {
  return (
    <>
      <Topbar title="Customers" />
      <div className="p-8 flex flex-col gap-6">
        <div className="flex gap-2.5">
          <span className="inline-flex items-center h-9 px-3 rounded-md border border-border bg-surface text-xs text-muted w-[260px]">
            Search name or phone
          </span>
          <FilterPill>VIP only ▾</FilterPill>
        </div>

        <Card className="pt-2 px-5 pb-5">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Instagram</Th>
                <Th>Tag</Th>
                <Th>Orders</Th>
                <Th>Total spent</Th>
                <Th>PDPA consent</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone}>
                  <Td>{c.name}</Td>
                  <Td>{c.phone}</Td>
                  <Td className={c.instagram ? "" : "text-muted"}>{c.instagram ?? "—"}</Td>
                  <Td>{c.tag ? <Badge tone="accent">{c.tag}</Badge> : <span className="text-muted">—</span>}</Td>
                  <Td>{c.orders}</Td>
                  <Td>{c.spent}</Td>
                  <Td className="text-muted">{c.consent ? "✓" : "–"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <span className="text-[11px] text-muted italic">
          Purchase history is pulled from Orders, not stored on the customer record.
        </span>

        <Card className="p-5 flex flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2.5">
            <span className="text-sm font-semibold mb-1">
              Customer detail (example) — Nichakan T.
            </span>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[11px] text-muted">Phone</span>
              <span>081-234-5678</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-[11px] text-muted">Address</span>
              <span>124/8 ต.บางนา อ.บางนา จ.กรุงเทพมหานคร</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2.5">
            <span className="text-sm font-semibold mb-1">Recent orders</span>
            {recentOrders.map((o) => (
              <span key={o.id} className="text-sm">
                {o.id} — {o.total} — {o.date}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
