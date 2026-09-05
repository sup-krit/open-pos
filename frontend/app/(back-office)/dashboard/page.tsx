"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import { Table, Td, Th } from "@/components/ui/Table";
import { useRequireAuth } from "@/lib/auth";
import {
  formatMinor,
  getDashboard,
  listProducts,
  type DashboardSummary,
  type Product,
  type SalesTrendPoint,
} from "@/lib/api";

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

// Single-series line chart — per dataviz skill, one series needs no legend
// (the card title already names it). Crosshair + tooltip on hover, no
// second y-axis for order_count (shown as a tooltip sub-label instead).
function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 760;
  const height = 180;
  const padding = { top: 12, right: 12, bottom: 22, left: 12 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const maxVal = Math.max(...data.map((d) => d.net_total_minor), 1);
    return data.map((d, i) => {
      const x = padding.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const y = padding.top + innerH - (d.net_total_minor / maxVal) * innerH;
      return { x, y, point: d };
    });
  }, [data, innerW, innerH]);

  if (data.length === 0) {
    return (
      <div className="h-[180px] border border-dashed border-border rounded-md flex items-center justify-center text-xs text-muted bg-paper">
        No sales data yet
      </div>
    );
  }

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const baselineY = padding.top + innerH;
  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[180px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <line
          x1={padding.left}
          y1={padding.top + innerH / 2}
          x2={width - padding.right}
          y2={padding.top + innerH / 2}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
          strokeOpacity={0.6}
        />
        <line
          x1={padding.left}
          y1={baselineY}
          x2={width - padding.right}
          y2={baselineY}
          className="text-border"
          stroke="currentColor"
          strokeWidth={1}
        />
        <path
          d={pathD}
          fill="none"
          className="text-accent"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1={padding.top}
              x2={hovered.x}
              y2={baselineY}
              className="text-muted"
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={4}
              className="text-accent"
              fill="currentColor"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
          </>
        )}
        <text x={points[0].x} y={height - 6} fontSize="9" className="text-muted" fill="currentColor" textAnchor="start">
          {formatDateShort(points[0].point.date)}
        </text>
        <text
          x={points[points.length - 1].x}
          y={height - 6}
          fontSize="9"
          className="text-muted"
          fill="currentColor"
          textAnchor="end"
        >
          {formatDateShort(points[points.length - 1].point.date)}
        </text>
      </svg>
      {hovered && (
        <div
          className="absolute pointer-events-none bg-ink text-paper text-[11px] rounded-md px-2.5 py-1.5 whitespace-nowrap -translate-x-1/2"
          style={{
            left: `${(hovered.x / width) * 100}%`,
            top: `${Math.max((hovered.y / height) * 100 - 16, 0)}%`,
          }}
        >
          <div className="font-semibold">{formatMinor(hovered.point.net_total_minor)}</div>
          <div className="text-paper/70">
            {formatDateShort(hovered.point.date)} · {hovered.point.order_count} orders
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { ready } = useRequireAuth();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch((err) => setLoadError(String(err)));
    listProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const revenueMinor = useMemo(
    () => (dashboard?.sales_trend ?? []).reduce((sum, d) => sum + d.net_total_minor, 0),
    [dashboard]
  );
  const orderCount = useMemo(
    () => (dashboard?.sales_trend ?? []).reduce((sum, d) => sum + d.order_count, 0),
    [dashboard]
  );
  const avgOrderValueMinor = orderCount > 0 ? revenueMinor / orderCount : 0;
  const lowStockCount = useMemo(
    () => products.filter((p) => p.status === "low_stock" || p.status === "out_of_stock").length,
    [products]
  );

  const channelRows = useMemo(() => {
    const rows = dashboard?.channel_breakdown ?? [];
    const total = rows.reduce((sum, r) => sum + r.net_total_minor, 0);
    return rows.map((r) => ({
      ...r,
      pct: total > 0 ? (r.net_total_minor / total) * 100 : 0,
    }));
  }, [dashboard]);

  const paymentRows = useMemo(() => {
    const rows = dashboard?.payment_mix ?? [];
    const total = rows.reduce((sum, r) => sum + r.net_total_minor, 0);
    return rows.map((r) => ({
      ...r,
      pct: total > 0 ? (r.net_total_minor / total) * 100 : 0,
    }));
  }, [dashboard]);

  const geographyRows = useMemo(
    () => [...(dashboard?.geography ?? [])].sort((a, b) => b.net_total_minor - a.net_total_minor),
    [dashboard]
  );

  const latestMargin = useMemo(() => {
    const rows = dashboard?.gross_margin ?? [];
    return rows.length > 0 ? rows[rows.length - 1] : null;
  }, [dashboard]);

  if (!ready) return null;

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-8 flex flex-col gap-6">
        {loadError && (
          <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2 w-fit">
            Couldn&apos;t load dashboard data: {loadError}
          </div>
        )}

        <div className="flex gap-5 items-stretch">
          <Card className="p-5 flex flex-col gap-2 flex-[1.3]">
            <span className="text-[11px] text-muted tracking-wide">REVENUE</span>
            <span className="text-2xl font-semibold">{formatMinor(revenueMinor)}</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 flex-1">
            <span className="text-[11px] text-muted tracking-wide">ORDERS</span>
            <span className="text-2xl font-semibold">{orderCount}</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 flex-1">
            <span className="text-[11px] text-muted tracking-wide">AVG ORDER VALUE</span>
            <span className="text-2xl font-semibold">{formatMinor(avgOrderValueMinor)}</span>
          </Card>
          <Card className="p-5 flex flex-col gap-2 flex-[0.9]">
            <span className="text-[11px] text-muted tracking-wide">LOW-STOCK ITEMS</span>
            <span className="text-2xl font-semibold">{lowStockCount}</span>
            <span className="text-xs font-medium text-muted">needs reorder</span>
          </Card>
        </div>

        <Card className="p-5 flex flex-col gap-2">
          <span className="text-sm font-semibold">Sales trend — by day</span>
          <SalesTrendChart data={dashboard?.sales_trend ?? []} />
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
                {(dashboard?.top_products ?? []).map((p) => (
                  <tr key={p.product_id}>
                    <Td>{p.name}</Td>
                    <Td>{p.qty_sold}</Td>
                    <Td>{formatMinor(p.revenue_minor)}</Td>
                  </tr>
                ))}
                {(dashboard?.top_products ?? []).length === 0 && (
                  <tr>
                    <Td colSpan={3} className="text-muted italic text-center py-6">
                      No product sales yet.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
          <Card className="p-5 flex flex-col flex-1">
            <span className="text-sm font-semibold mb-1">Customer segments</span>
            <span className="text-[11px] text-muted italic mb-1">
              Segmentation rules not yet defined — illustrative only
            </span>
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
            <span className="text-[11px] text-muted italic mb-1">
              Per-promotion attribution not yet available — illustrative only
            </span>
            <Table>
              <thead>
                <tr>
                  <Th>Promotion</Th>
                  <Th>Redemptions</Th>
                  <Th>Revenue influenced</Th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "10% off — min 3 items", redemptions: 52, revenue: "฿41,200" },
                  { name: "CODE: SAVE10", redemptions: 18, revenue: "฿15,900" },
                  { name: "Reward coupon (next visit)", redemptions: 9, revenue: "฿8,100" },
                ].map((p) => (
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
            {channelRows.map((r) => (
              <div key={r.channel} className="flex items-center gap-2.5 text-xs">
                <span className="w-[90px] shrink-0 capitalize">{r.channel}</span>
                <div className="flex-1 h-2.5 rounded bg-locked-tint overflow-hidden">
                  <div className="h-full rounded bg-accent" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-muted">{r.pct.toFixed(0)}%</span>
              </div>
            ))}
            {channelRows.length === 0 && (
              <span className="text-sm text-muted italic">No orders yet</span>
            )}
          </Card>
        </div>

        <div className="flex gap-5 items-stretch">
          <Card className="p-5 flex flex-col gap-2 flex-1">
            <span className="text-sm font-semibold mb-1">Geography</span>
            <Table>
              <thead>
                <tr>
                  <Th>Province</Th>
                  <Th>Orders</Th>
                  <Th>Revenue</Th>
                </tr>
              </thead>
              <tbody>
                {geographyRows.map((g) => (
                  <tr key={g.province}>
                    <Td>{g.province}</Td>
                    <Td>{g.order_count}</Td>
                    <Td>{formatMinor(g.net_total_minor)}</Td>
                  </tr>
                ))}
                {geographyRows.length === 0 && (
                  <tr>
                    <Td colSpan={3} className="text-muted italic text-center py-6">
                      No customer address data yet.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
          <Card className="p-5 flex flex-col flex-1">
            <span className="text-sm font-semibold mb-1">Payment mix</span>
            {paymentRows.map((r) => (
              <div
                key={r.payment_method}
                className="flex justify-between text-[13px] py-1.5 border-b border-border last:border-b-0"
              >
                <span className="uppercase">{r.payment_method}</span>
                <span className="text-muted">{r.pct.toFixed(0)}%</span>
              </div>
            ))}
            {paymentRows.length === 0 && (
              <span className="text-sm text-muted italic">No orders yet</span>
            )}
          </Card>
          <Card className="p-5 flex flex-col flex-1">
            <span className="text-sm font-semibold mb-1">Gross margin</span>
            {latestMargin ? (
              [
                ["Revenue", formatMinor(latestMargin.revenue_minor)],
                ["Cost", formatMinor(latestMargin.cost_minor)],
                ["Margin", `${latestMargin.gross_margin_pct.toFixed(1)}%`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between text-[13px] py-1.5 border-b border-border last:border-b-0"
                >
                  <span>{label}</span>
                  <span className="text-muted">{value}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted italic">No margin data yet</span>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
