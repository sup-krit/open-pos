"use client";

import { useEffect, useMemo, useState } from "react";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import FilterPill from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";
import { useRequireAuth } from "@/lib/auth";
import { formatMinor, listCustomers, listOrders, type Customer, type Order } from "@/lib/api";

function formatAddress(c: Customer): string {
  const parts = [
    c.address_subdistrict ? `ต.${c.address_subdistrict}` : null,
    c.address_district ? `อ.${c.address_district}` : null,
    c.address_province ? `จ.${c.address_province}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "No address on file";
}

export default function CustomersPage() {
  const { ready } = useRequireAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    listCustomers()
      .then(setCustomers)
      .catch((err) => setLoadError(String(err)));
    listOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (vipOnly && c.tag !== "VIP") return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q);
    });
  }, [customers, search, vipOnly]);

  const recentOrders = useMemo(() => {
    if (!selected) return [];
    return orders
      .filter((o) => o.customer_id === selected.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [orders, selected]);

  if (!ready) return null;

  return (
    <>
      <Topbar title="Customers" />
      <div className="p-8 flex flex-col gap-6">
        <div className="flex gap-2.5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone"
            className="inline-flex items-center h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink placeholder:text-muted w-[260px]"
          />
          <FilterPill active={vipOnly} onClick={() => setVipOnly((v) => !v)}>
            VIP only ▾
          </FilterPill>
        </div>

        {loadError && (
          <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2 w-fit">
            Couldn&apos;t load customers: {loadError}
          </div>
        )}

        <Card className="pt-2 px-5 pb-5">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>Social</Th>
                <Th>Tag</Th>
                <Th>Orders</Th>
                <Th>Total spent</Th>
                <Th>PDPA consent</Th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="cursor-pointer hover:bg-surface"
                >
                  <Td>{c.name}</Td>
                  <Td>{c.phone}</Td>
                  <Td className={c.social_handle ? "" : "text-muted"}>{c.social_handle ?? "—"}</Td>
                  <Td>{c.tag ? <Badge tone="accent">{c.tag}</Badge> : <span className="text-muted">—</span>}</Td>
                  <Td>{c.total_orders}</Td>
                  <Td>{formatMinor(c.total_spent_minor)}</Td>
                  <Td className="text-muted">{c.pdpa_consent ? "✓" : "–"}</Td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && !loadError && (
                <tr>
                  <Td colSpan={7} className="text-muted italic text-center py-6">
                    No customers match these filters.
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
        <span className="text-[11px] text-muted italic">
          Purchase history is pulled from Orders, not stored on the customer record.
        </span>

        <Card className="p-5 flex flex-row gap-8">
          <div className="flex-1 flex flex-col gap-2.5">
            <span className="text-sm font-semibold mb-1">
              {selected ? `Customer detail — ${selected.name}` : "Customer detail"}
            </span>
            {selected ? (
              <>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] text-muted">Phone</span>
                  <span>{selected.phone}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-[11px] text-muted">Address</span>
                  <span>{formatAddress(selected)}</span>
                </div>
              </>
            ) : (
              <span className="text-sm text-muted italic">Select a customer to see details</span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2.5">
            <span className="text-sm font-semibold mb-1">Recent orders</span>
            {selected ? (
              recentOrders.length > 0 ? (
                recentOrders.map((o) => (
                  <span key={o.id} className="text-sm">
                    {o.id.slice(0, 8).toUpperCase()} — {formatMinor(o.net_total_minor)} —{" "}
                    {new Date(o.created_at).toLocaleDateString("th-TH")}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted italic">No orders yet</span>
              )
            ) : (
              <span className="text-sm text-muted italic">Select a customer to see details</span>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
