"use client";

import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import { Table, Td, Th } from "@/components/ui/Table";
import FilterPill from "@/components/ui/Select";
import { useRequireAuth } from "@/lib/auth";

// Sample data — static placeholders for the scaffold. Wire up to the FastAPI
// backend once that API surface exists.
const topProducts = [
  { name: "Round-cut pendant", units: 34, revenue: "฿24,800" },
  { name: "Layered chain bracelet", units: 29, revenue: "฿19,300" },
  { name: "Studded hoop earrings", units: 21, revenue: "฿12,600" },
];

const promoPerformance = [
  { name: "10% off — min 3 items", redemptions: 52, revenue: "฿41,200" },
  { name: "CODE: SAVE10", redemptions: 18, revenue: "฿15,900" },
  { name: "Reward coupon (next visit)", redemptions: 9, revenue: "฿8,100" },
];

export default function DashboardPage() {
  const { ready } = useRequireAuth();
  if (!ready) return null;

  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <>
            <FilterPill>This week ▾</FilterPill>
            <span className="text-[11px] text-muted">vs. last week · sample data</span>
          </>
        }
      />
      <div className="p-8 flex flex-col gap-6">
        <div className="flex gap-5 items-stretch">
          <Card className="p-5 flex flex-col gap-2 flex-[1.3]">
            <span className="text-[11px] text-muted tracking-wide">REVENUE</span>
            <span className="text-2xl font-semibold">฿186,400</span>
            <span className="text-xs font-medium text-accent">+12% vs last week</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 flex-1">
            <span className="text-[11px] text-muted tracking-wide">ORDERS</span>
            <span className="text-2xl font-semibold">142</span>
            <span className="text-xs font-medium text-accent">+5%</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 flex-1">
            <span className="text-[11px] text-muted tracking-wide">AVG ORDER VALUE</span>
            <span className="text-2xl font-semibold">฿1,312</span>
            <span className="text-xs font-medium text-muted">-1%</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 flex-[0.9]">
            <span className="text-[11px] text-muted tracking-wide">LOW-STOCK ITEMS</span>
            <span className="text-2xl font-semibold">7</span>
            <span className="text-xs font-medium text-muted">needs reorder</span>
          </Card>
        </div>

        <Card className="p-5 flex flex-col gap-2">
          <span className="text-sm font-semibold">Sales trend — by day</span>
          <div className="h-[180px] border border-dashed border-border rounded-md flex items-center justify-center text-xs text-muted bg-paper">
            line/bar chart placeholder
          </div>
        </Card>

        <div className="flex gap-5 items-stretch">
          <Card className="p-5 flex flex-col gap-2 flex-[1.2]">
            <span className="text-sm font-semibold mb-1">Top products</span>
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Units</Th>
                  <Th>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name}>
                    <Td>{p.name}</Td>
                    <Td>{p.units}</Td>
                    <Td>{p.revenue}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <Card className="p-5 flex flex-col flex-1">
            <span className="text-sm font-semibold mb-1">Customer segments</span>
            {[
              ["New customers", "38%"],
              ["Returning customers", "62%"],
              ["Repeat-purchase rate", "27%"],
              ["Avg order value (returning)", "฿1,540"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between text-[13px] py-1.5 border-b border-border last:border-b-0"
              >
                <span>{label}</span>
                <span className="text-muted">{value}</span>
              </div>
            ))}
          </Card>
        </div>

        <div className="flex gap-5 items-stretch">
          <Card className="p-5 flex flex-col gap-2 flex-[1.2]">
            <span className="text-sm font-semibold mb-1">Promotion / coupon performance</span>
            <Table>
              <thead>
                <tr>
                  <Th>Promotion</Th>
                  <Th>Redemptions</Th>
                  <Th>Revenue influenced</Th>
                </tr>
              </thead>
              <tbody>
                {promoPerformance.map((p) => (
                  <tr key={p.name}>
                    <Td>{p.name}</Td>
                    <Td>{p.redemptions}</Td>
                    <Td>{p.revenue}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
          <Card className="p-5 flex flex-col gap-3 flex-1">
            <span className="text-sm font-semibold">Channel breakdown</span>
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-[70px] shrink-0">POS</span>
              <div className="flex-1 h-2.5 rounded bg-locked-tint overflow-hidden">
                <div className="h-full rounded bg-accent" style={{ width: "64%" }} />
              </div>
              <span className="text-muted">64%</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-[70px] shrink-0">Online/Social</span>
              <div className="flex-1 h-2.5 rounded bg-locked-tint overflow-hidden">
                <div className="h-full rounded bg-accent" style={{ width: "36%" }} />
              </div>
              <span className="text-muted">36%</span>
            </div>
          </Card>
        </div>

        <div className="flex gap-5 items-stretch">
          <Card className="p-5 flex flex-col gap-2 flex-1">
            <span className="text-sm font-semibold mb-1">Geography</span>
            <div className="h-[120px] border border-dashed border-border rounded-md flex items-center justify-center text-xs text-muted bg-paper">
              map placeholder — by province
            </div>
          </Card>
          <Card className="p-5 flex flex-col flex-1">
            <span className="text-sm font-semibold mb-1">Payment / shipping mix</span>
            {[
              ["QR", "71%"],
              ["Card", "29%"],
              ["Avg shipping cost", "฿52"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between text-[13px] py-1.5 border-b border-border last:border-b-0"
              >
                <span>{label}</span>
                <span className="text-muted">{value}</span>
              </div>
            ))}
          </Card>
          <Card className="p-5 flex flex-col flex-1">
            <span className="text-sm font-semibold mb-1">Gross margin</span>
            {[
              ["Revenue", "฿186,400"],
              ["Cost", "฿108,900"],
              ["Margin", "42%"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between text-[13px] py-1.5 border-b border-border last:border-b-0"
              >
                <span>{label}</span>
                <span className="text-muted">{value}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
