"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Table, Td, Th } from "@/components/ui/Table";
import { useRequireAuth } from "@/lib/auth";
import {
  createProduct,
  formatMinor,
  listProducts,
  updateProduct,
  type Product,
  type ProductCreateInput,
  type ProductUpdateInput,
} from "@/lib/api";

const lockedTh = "bg-locked-tint";
const lockedTd = "bg-locked-tint";

const statusLabel: Record<Product["status"], string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const statusTone: Record<Product["status"], "neutral" | "ink-strong"> = {
  in_stock: "neutral",
  low_stock: "ink-strong",
  out_of_stock: "ink-strong",
};

type EditableField = "cost_minor" | "price_minor" | "vendor" | "stock_quantity" | "low_stock_threshold";

const emptyForm = {
  sku: "",
  name: "",
  cost: "",
  price: "",
  group_name: "",
  variant_attribute: "",
  lot: "",
  vendor: "",
  stock_quantity: "",
  low_stock_threshold: "",
};

function initialEditValue(product: Product, field: EditableField): string {
  switch (field) {
    case "cost_minor":
      return String(product.cost_minor / 100);
    case "price_minor":
      return String(product.price_minor / 100);
    case "vendor":
      return product.vendor ?? "";
    case "stock_quantity":
      return String(product.stock_quantity);
    case "low_stock_threshold":
      return String(product.low_stock_threshold);
  }
}

export default function InventoryPage() {
  const { ready } = useRequireAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    group_name: "",
    variant_attribute: "",
    status: "",
    vendor: "",
  });

  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const committingKeysRef = useRef<Set<string>>(new Set());
  const skipBlurRef = useRef(false);
  const editingRef = useRef(editing);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    listProducts({
      group_name: filters.group_name || undefined,
      variant_attribute: filters.variant_attribute || undefined,
      status: filters.status || undefined,
      vendor: filters.vendor || undefined,
    })
      .then(setProducts)
      .catch((err) => setLoadError(String(err)));
  }, [filters]);

  const groupOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.group_name).filter((v): v is string => !!v))),
    [products]
  );
  const variantOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.variant_attribute).filter((v): v is string => !!v))),
    [products]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.status))),
    [products]
  );
  const vendorOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.vendor).filter((v): v is string => !!v))),
    [products]
  );

  function startEdit(product: Product, field: EditableField) {
    setEditing({ id: product.id, field });
    setEditValue(initialEditValue(product, field));
    setEditError(null);
  }

  function cancelEdit() {
    skipBlurRef.current = true;
    setEditing(null);
    setEditError(null);
  }

  function commitEdit(product: Product, field: EditableField) {
    const key = `${product.id}:${field}`;
    if (committingKeysRef.current.has(key)) return;

    let body: ProductUpdateInput;
    if (field === "cost_minor" || field === "price_minor") {
      const baht = parseFloat(editValue);
      if (Number.isNaN(baht)) {
        setEditError("Enter a valid amount.");
        return;
      }
      body = { [field]: Math.round(baht * 100) };
    } else if (field === "stock_quantity" || field === "low_stock_threshold") {
      const qty = parseInt(editValue, 10);
      if (Number.isNaN(qty)) {
        setEditError("Enter a valid whole number.");
        return;
      }
      body = { [field]: qty };
    } else {
      body = { vendor: editValue.trim() || null };
    }

    committingKeysRef.current.add(key);
    updateProduct(product.id, body)
      .then((updated) => {
        committingKeysRef.current.delete(key);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        // Only touch the shared "editing"/"editError" state if this cell is
        // still the one being edited — another cell may have been opened
        // while this request was in flight, and its unsaved value must not
        // be clobbered by an unrelated commit resolving late.
        if (editingRef.current?.id === product.id && editingRef.current.field === field) {
          setEditing(null);
          setEditError(null);
        }
      })
      .catch((err) => {
        committingKeysRef.current.delete(key);
        if (editingRef.current?.id === product.id && editingRef.current.field === field) {
          setEditError(String(err));
        }
      });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, product: Product, field: EditableField) {
    if (e.key === "Enter") {
      commitEdit(product, field);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  function handleBlur(product: Product, field: EditableField) {
    if (skipBlurRef.current) {
      skipBlurRef.current = false;
      return;
    }
    commitEdit(product, field);
  }

  function renderEditableCell(product: Product, field: EditableField, display: string) {
    const isEditing = editing?.id === product.id && editing.field === field;
    if (!isEditing) {
      return (
        <Td onDoubleClick={() => startEdit(product, field)} className="cursor-text">
          {display}
        </Td>
      );
    }
    return (
      <Td>
        <input
          autoFocus
          type={field === "vendor" ? "text" : "number"}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, product, field)}
          onBlur={() => handleBlur(product, field)}
          className="h-8 px-2 w-full rounded border border-accent bg-surface text-[13px] text-ink"
        />
        {editError && <div className="text-[11px] text-accent mt-1">{editError}</div>}
      </Td>
    );
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cost = parseFloat(form.cost);
    const price = parseFloat(form.price);
    if (!form.sku.trim() || !form.name.trim() || Number.isNaN(cost) || Number.isNaN(price)) {
      setFormError("SKU, name, cost, and price are required.");
      return;
    }
    const body: ProductCreateInput = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      cost_minor: Math.round(cost * 100),
      price_minor: Math.round(price * 100),
      group_name: form.group_name.trim() || undefined,
      variant_attribute: form.variant_attribute.trim() || undefined,
      lot: form.lot.trim() || undefined,
      vendor: form.vendor.trim() || undefined,
      stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity, 10) : undefined,
      low_stock_threshold: form.low_stock_threshold ? parseInt(form.low_stock_threshold, 10) : undefined,
    };
    createProduct(body)
      .then((created) => {
        setProducts((prev) => [created, ...prev]);
        setForm(emptyForm);
        setFormError(null);
        setShowAddForm(false);
      })
      .catch((err) => setFormError(String(err)));
  }

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
            <Button onClick={() => setShowAddForm((v) => !v)}>+ Add product</Button>
          </>
        }
      />
      <div className="p-8 flex flex-col gap-3">
        <div className="flex gap-2.5">
          <select
            value={filters.group_name}
            onChange={(e) => setFilters((f) => ({ ...f, group_name: e.target.value }))}
            className="inline-flex items-center h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink"
          >
            <option value="">Group ▾</option>
            {groupOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={filters.variant_attribute}
            onChange={(e) => setFilters((f) => ({ ...f, variant_attribute: e.target.value }))}
            className="inline-flex items-center h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink"
          >
            <option value="">Variant ▾</option>
            {variantOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="inline-flex items-center h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink"
          >
            <option value="">Status ▾</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
          <select
            value={filters.vendor}
            onChange={(e) => setFilters((f) => ({ ...f, vendor: e.target.value }))}
            className="inline-flex items-center h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink"
          >
            <option value="">Vendor ▾</option>
            {vendorOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {loadError && (
          <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2 w-fit">
            Couldn&apos;t load products: {loadError}
          </div>
        )}

        {showAddForm && (
          <Card className="p-5 flex flex-col gap-3">
            <span className="text-sm font-semibold">Add product</span>
            <form onSubmit={handleAddSubmit} className="flex flex-col gap-3">
              <div className="flex gap-3 flex-wrap">
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  SKU
                  <input
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[140px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Name
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[180px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Cost (฿)
                  <input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[100px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Price (฿)
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[100px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Group
                  <input
                    value={form.group_name}
                    onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[120px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Variant
                  <input
                    value={form.variant_attribute}
                    onChange={(e) => setForm((f) => ({ ...f, variant_attribute: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[120px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Lot
                  <input
                    value={form.lot}
                    onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[120px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Vendor
                  <input
                    value={form.vendor}
                    onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[140px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Stock quantity
                  <input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[110px]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] text-muted">
                  Low-stock threshold
                  <input
                    type="number"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-ink w-[110px]"
                  />
                </label>
              </div>
              {formError && <div className="text-xs text-accent">{formError}</div>}
              <div className="flex gap-2.5">
                <Button type="submit" size="sm">
                  Save product
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setForm(emptyForm);
                    setFormError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

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
                <Th>Stock qty</Th>
                <Th>Low-stock threshold</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <Td className={lockedTd}>{p.group_name ?? "—"}</Td>
                  <Td className={lockedTd}>{p.variant_attribute ?? "—"}</Td>
                  <Td className={lockedTd}>{p.lot ?? "—"}</Td>
                  {renderEditableCell(p, "cost_minor", formatMinor(p.cost_minor))}
                  {renderEditableCell(p, "price_minor", formatMinor(p.price_minor))}
                  <Td>{p.margin_pct.toFixed(0)}%</Td>
                  <Td>{formatMinor(p.profit_minor)}</Td>
                  <Td>
                    <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>
                  </Td>
                  {renderEditableCell(p, "vendor", p.vendor ?? "—")}
                  {renderEditableCell(p, "stock_quantity", String(p.stock_quantity))}
                  {renderEditableCell(p, "low_stock_threshold", String(p.low_stock_threshold))}
                </tr>
              ))}
              {products.length === 0 && !loadError && (
                <tr>
                  <Td colSpan={11} className="text-muted italic text-center py-6">
                    No products match these filters.
                  </Td>
                </tr>
              )}
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
