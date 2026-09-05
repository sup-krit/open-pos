"use client";

import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FilterPill from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";
import { useRequireAuth } from "@/lib/auth";

// Sample data — static placeholders for the scaffold.
const products = [
  {
    group: "Pendant",
    variant: "Round-cut",
    lot: "LOT-2201",
    cost: "฿420",
    price: "฿890",
    margin: "53%",
    profit: "฿470",
    status: { label: "In stock", tone: "neutral" as const },
    vendor: "Siam Gems",
  },
  {
    group: "Bracelet",
    variant: "Layered chain",
    lot: "LOT-2188",
    cost: "฿310",
    price: "฿650",
    margin: "52%",
    profit: "฿340",
    status: { label: "In stock", tone: "neutral" as const },
    vendor: "Metalworks Co.",
  },
  {
    group: "Earrings",
    variant: "Studded hoop",
    lot: "LOT-2179",
    cost: "฿180",
    price: "฿420",
    margin: "57%",
    profit: "฿240",
    status: { label: "Low stock", tone: "ink-strong" as const },
    vendor: "Siam Gems",
  },
  {
    group: "Necklace",
    variant: "Oval cut",
    lot: "LOT-2160",
    cost: "฿520",
    price: "฿1,190",
    margin: "56%",
    profit: "฿670",
    status: { label: "Out of stock", tone: "ink-strong" as const },
    vendor: "Crystal Origin",
  },
  {
    group: "Ring",
    variant: "Solitaire",
    lot: "LOT-2201",
    cost: "฿280",
    price: "฿590",
    margin: "53%",
    profit: "฿310",
    status: { label: "In stock", tone: "neutral" as const },
    vendor: "Metalworks Co.",
  },
];

const lockedTh = "bg-locked-tint";
const lockedTd = "bg-locked-tint";

export default function InventoryPage() {
  const { ready } = useRequireAuth();
  if (!ready) return null;

  return (
    <>
      <Topbar
        title="Inventory / Stock"
        actions={
          <>
            <span className="text-[11px] text-muted italic">
              Adds directly here — no spreadsheet step
            </span>
            <Button>+ Add product</Button>
          </>
        }
      />
      <div className="p-8 flex flex-col gap-3">
        <div className="flex gap-2.5">
          <FilterPill>Group ▾</FilterPill>
          <FilterPill>Variant ▾</FilterPill>
          <FilterPill>Status ▾</FilterPill>
          <FilterPill>Vendor ▾</FilterPill>
        </div>
        <span className="text-[11px] text-muted italic">
          Custom columns — user-defined field types, not a fixed list.
        </span>
        <Card className="pt-2 px-5 pb-5">
          <Table>
            <thead>
              <tr>
                <Th className={lockedTh}>Group</Th>
                <Th className={lockedTh}>Variant</Th>
                <Th className={lockedTh}>Lot</Th>
                <Th>Cost</Th>
                <Th>Price</Th>
                <Th>Margin %</Th>
                <Th>Profit</Th>
                <Th>Status</Th>
                <Th>Vendor</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={`${p.group}-${p.variant}-${p.lot}`}>
                  <Td className={lockedTd}>{p.group}</Td>
                  <Td className={lockedTd}>{p.variant}</Td>
                  <Td className={lockedTd}>{p.lot}</Td>
                  <Td>{p.cost}</Td>
                  <Td>{p.price}</Td>
                  <Td>{p.margin}</Td>
                  <Td>{p.profit}</Td>
                  <Td>
                    <Badge tone={p.status.tone}>{p.status.label}</Badge>
                  </Td>
                  <Td>{p.vendor}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <span className="text-[11px] text-muted italic">
          Double-click a cell to edit inline.
        </span>
      </div>
    </>
  );
}
