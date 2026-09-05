"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  createPromotion,
  listPromotions,
  updatePromotion,
  setPromotionStatus,
  type Promotion,
  type PromotionCreateInput,
  type PromotionUpdateInput,
} from "@/lib/api";
import { useRequireRole } from "@/lib/auth";

function Chip({ children }: { children: string }) {
  return (
    <span className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted">
      {children}
    </span>
  );
}

type FormState = {
  name: string;
  description: string;
  status: "active" | "inactive";
  condition_type: string;
  discount_type: string;
  min_value: string;
  priority: string;
  start_date: string;
  end_date: string;
  auto_apply: boolean;
  manual_selectable: boolean;
  stackable: boolean;
  bogo_buy_qty: string;
  bogo_get_qty: string;
  bogo_get_discount_pct: string;
  coupon_code: string;
  coupon_redemption_limit_total: string;
  coupon_redemption_limit_per_customer: string;
  coupon_valid_from: string;
  coupon_valid_until: string;
};

function blankForm(): FormState {
  return {
    name: "",
    description: "",
    status: "inactive",
    condition_type: "qty",
    discount_type: "percent",
    min_value: "0",
    priority: "0",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    auto_apply: false,
    manual_selectable: false,
    stackable: false,
    bogo_buy_qty: "",
    bogo_get_qty: "",
    bogo_get_discount_pct: "",
    coupon_code: "",
    coupon_redemption_limit_total: "",
    coupon_redemption_limit_per_customer: "",
    coupon_valid_from: "",
    coupon_valid_until: "",
  };
}

function formFromPromotion(p: Promotion): FormState {
  return {
    name: p.name,
    description: p.description ?? "",
    status: p.status,
    condition_type: p.condition_type ?? "qty",
    discount_type: p.discount_type ?? "percent",
    min_value: p.min_value != null ? String(p.min_value) : "0",
    priority: String(p.priority),
    start_date: p.start_date ?? "",
    end_date: p.end_date ?? "",
    auto_apply: p.auto_apply,
    manual_selectable: p.manual_selectable,
    stackable: p.stackable,
    bogo_buy_qty: p.bogo_buy_qty != null ? String(p.bogo_buy_qty) : "",
    bogo_get_qty: p.bogo_get_qty != null ? String(p.bogo_get_qty) : "",
    bogo_get_discount_pct:
      p.bogo_get_discount_pct != null ? String(p.bogo_get_discount_pct) : "",
    coupon_code: p.coupon_code ?? "",
    coupon_redemption_limit_total:
      p.coupon_redemption_limit_total != null ? String(p.coupon_redemption_limit_total) : "",
    coupon_redemption_limit_per_customer:
      p.coupon_redemption_limit_per_customer != null
        ? String(p.coupon_redemption_limit_per_customer)
        : "",
    coupon_valid_from: p.coupon_valid_from ? p.coupon_valid_from.slice(0, 16) : "",
    coupon_valid_until: p.coupon_valid_until ? p.coupon_valid_until.slice(0, 16) : "",
  };
}

function toCreatePayload(form: FormState): PromotionCreateInput {
  const isBogo = form.discount_type === "bogo";
  const hasCoupon = form.coupon_code.trim() !== "";
  return {
    name: form.name,
    description: form.description || null,
    condition_type: form.condition_type,
    discount_type: form.discount_type,
    min_value: Number(form.min_value) || 0,
    start_date: form.start_date,
    end_date: form.end_date || null,
    priority: Number(form.priority) || 0,
    auto_apply: form.auto_apply,
    manual_selectable: form.manual_selectable,
    stackable: form.stackable,
    bogo_buy_qty: isBogo && form.bogo_buy_qty ? Number(form.bogo_buy_qty) : null,
    bogo_get_qty: isBogo && form.bogo_get_qty ? Number(form.bogo_get_qty) : null,
    bogo_get_discount_pct:
      isBogo && form.bogo_get_discount_pct ? Number(form.bogo_get_discount_pct) : null,
    coupon_code: hasCoupon ? form.coupon_code : null,
    coupon_redemption_limit_total:
      hasCoupon && form.coupon_redemption_limit_total
        ? Number(form.coupon_redemption_limit_total)
        : null,
    coupon_redemption_limit_per_customer:
      hasCoupon && form.coupon_redemption_limit_per_customer
        ? Number(form.coupon_redemption_limit_per_customer)
        : null,
    coupon_valid_from: hasCoupon && form.coupon_valid_from ? form.coupon_valid_from : null,
    coupon_valid_until: hasCoupon && form.coupon_valid_until ? form.coupon_valid_until : null,
    status: form.status,
  };
}

// General-update payload never carries `status` — activation goes through
// the dedicated /status endpoint (see handleStatusChange below).
function toUpdatePayload(form: FormState): PromotionUpdateInput {
  const { status: _status, ...rest } = toCreatePayload(form);
  return rest;
}

// Illustrative-only example cart for the live preview: qty/amount comes
// from the form's own min_value, priced at a placeholder unit price of
// ฿900 (a representative mid-range item price for this shop).
const EXAMPLE_UNIT_PRICE_BAHT = 900;

function computePreview(form: FormState) {
  const minValue = Number(form.min_value) || 0;
  // min_value doubles as a unit count (qty/variant conditions) or a baht
  // threshold (amount conditions) on the backend. For an amount condition,
  // treating min_value as an example quantity produces absurd carts (e.g.
  // "1000 units"), so use a small fixed example quantity instead and make
  // sure the example subtotal actually meets the stated minimum spend.
  const isAmountCondition = form.condition_type === "amount";
  const exampleQty = isAmountCondition ? 3 : Math.max(1, Math.round(minValue));
  const baseSubtotal = exampleQty * EXAMPLE_UNIT_PRICE_BAHT;
  const subtotal = isAmountCondition ? Math.max(minValue, baseSubtotal) : baseSubtotal;

  let label: string;
  let discount: number;

  if (form.discount_type === "fixed") {
    discount = minValue;
    label = `Buy ${exampleQty} → ฿${minValue} off`;
  } else if (form.discount_type === "bogo") {
    const buyQty = Number(form.bogo_buy_qty) || 0;
    const getQty = Number(form.bogo_get_qty) || 0;
    const pct = Number(form.bogo_get_discount_pct) || 0;
    const cycleSize = buyQty + getQty;
    const cycles = cycleSize > 0 ? Math.floor(exampleQty / cycleSize) : 0;
    const discountedUnits = cycles * getQty;
    discount = discountedUnits * EXAMPLE_UNIT_PRICE_BAHT * (pct / 100);
    label = `Buy ${buyQty} get ${getQty} → ${discountedUnits} unit(s) at ${pct}% off`;
  } else {
    // percent — min_value is also the percent-off magnitude on the backend
    // (see services/promotions.py). Clamp to 0-100 here purely as a
    // display safety net so a large amount-condition min_value (e.g. 1000
    // baht) can't render as "1000% off".
    const pct = Math.min(100, Math.max(0, minValue));
    discount = subtotal * (pct / 100);
    label = `Buy ${exampleQty} → ${pct}% off`;
  }

  // No combination of form inputs should ever produce a negative
  // "after discount" price or a save amount bigger than the subtotal.
  discount = Math.round(Math.max(0, Math.min(discount, subtotal)));

  return { label, subtotal, discount };
}

export default function PromotionsPage() {
  const { ready } = useRequireRole("owner_admin");

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  function refreshList() {
    return listPromotions()
      .then(setPromotions)
      .catch((err) => setLoadError(String(err)));
  }

  useEffect(() => {
    refreshList();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(blankForm());
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function editPromotion(p: Promotion) {
    setEditingId(p.id);
    setForm(formFromPromotion(p));
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function handleStatusChange(next: "active" | "inactive") {
    setForm((f) => ({ ...f, status: next }));
    if (!editingId) return;
    setStatusSaving(true);
    setPromotionStatus(editingId, next)
      .then(() => refreshList())
      .catch((err) => setSubmitError(String(err)))
      .finally(() => setStatusSaving(false));
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      if (editingId) {
        await updatePromotion(editingId, toUpdatePayload(form));
      } else {
        const created = await createPromotion(toCreatePayload(form));
        // Switch into edit mode for the row we just created so a second
        // click on Submit updates it instead of creating a duplicate.
        setEditingId(created.id);
        setForm(formFromPromotion(created));
      }
      await refreshList();
      setSubmitSuccess("Saved.");
    } catch (err) {
      setSubmitError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  const preview = computePreview(form);

  return (
    <>
      <Topbar title="Promotions" actions={<Button size="lg" onClick={resetForm}>+ Create promotion</Button>} />
      <div className="p-8 flex flex-col gap-6">
        {loadError && (
          <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2 w-fit">
            Couldn&apos;t load promotions: {loadError}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {promotions.map((promo) => {
            const chips: string[] = [];
            if (promo.auto_apply) chips.push("Auto-apply");
            if (promo.stackable) chips.push("Stackable");
            if (promo.manual_selectable) chips.push("Manual");
            if (promo.coupon_code) {
              chips.push(`CODE: ${promo.coupon_code}`);
              chips.push(
                `${promo.coupon_redemption_count} / ${
                  promo.coupon_redemption_limit_total ?? "∞"
                } used`
              );
            }
            return (
              <Card
                key={promo.id}
                onClick={() => editPromotion(promo)}
                className={`p-4 flex flex-col gap-2 cursor-pointer ${
                  editingId === promo.id ? "border-ink" : ""
                }`}
              >
                <span className="text-sm font-semibold">{promo.name}</span>
                <Badge tone={promo.status === "active" ? "accent" : "neutral"}>
                  {promo.status === "active" ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-muted">{promo.description}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {chips.map((chip) => (
                    <Chip key={chip}>{chip}</Chip>
                  ))}
                </div>
              </Card>
            );
          })}
          <div
            onClick={resetForm}
            className="border border-dashed border-border rounded-md flex items-center justify-center text-sm text-muted min-h-[140px] cursor-pointer"
          >
            + Create new promotion
          </div>
        </div>

        <Card className="p-5 flex flex-col">
          <span className="text-sm font-semibold mb-3">
            {editingId ? "Edit promotion" : "Create promotion"}
          </span>
          <div className="flex gap-5">
            <div className="flex-1 flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Name
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Status {statusSaving && "(saving…)"}
                  <select
                    value={form.status}
                    onChange={(e) => handleStatusChange(e.target.value as "active" | "inactive")}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Description
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Condition type
                  <select
                    value={form.condition_type}
                    onChange={(e) => setForm((f) => ({ ...f, condition_type: e.target.value }))}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  >
                    <option value="qty">Min quantity</option>
                    <option value="amount">Min order amount</option>
                    <option value="variant">Min qty of one variant</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Discount type
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  >
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                    <option value="bogo">BOGO</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Minimum value
                  <input
                    type="number"
                    value={form.min_value}
                    onChange={(e) => setForm((f) => ({ ...f, min_value: e.target.value }))}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Priority
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Start date
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  End date
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
              </div>

              {form.discount_type === "bogo" && (
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                    Buy qty
                    <input
                      type="number"
                      value={form.bogo_buy_qty}
                      onChange={(e) => setForm((f) => ({ ...f, bogo_buy_qty: e.target.value }))}
                      className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                    Get qty
                    <input
                      type="number"
                      value={form.bogo_get_qty}
                      onChange={(e) => setForm((f) => ({ ...f, bogo_get_qty: e.target.value }))}
                      className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                    Get item discount %
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.bogo_get_discount_pct}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, bogo_get_discount_pct: e.target.value }))
                      }
                      className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                    />
                  </label>
                </div>
              )}

              <div className="flex gap-4 text-xs items-center">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.auto_apply}
                    onChange={(e) => setForm((f) => ({ ...f, auto_apply: e.target.checked }))}
                    className="w-auto h-auto"
                  />{" "}
                  Auto-apply
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.manual_selectable}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, manual_selectable: e.target.checked }))
                    }
                    className="w-auto h-auto"
                  />{" "}
                  Manual
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.stackable}
                    onChange={(e) => setForm((f) => ({ ...f, stackable: e.target.checked }))}
                    className="w-auto h-auto"
                  />{" "}
                  Stackable
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Coupon code (optional)
                <input
                  value={form.coupon_code}
                  onChange={(e) => setForm((f) => ({ ...f, coupon_code: e.target.value }))}
                  className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                />
              </label>

              {form.coupon_code.trim() !== "" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                    Redemption limit (total)
                    <input
                      type="number"
                      value={form.coupon_redemption_limit_total}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, coupon_redemption_limit_total: e.target.value }))
                      }
                      className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                    Redemption limit (per customer)
                    <input
                      type="number"
                      value={form.coupon_redemption_limit_per_customer}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          coupon_redemption_limit_per_customer: e.target.value,
                        }))
                      }
                      className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                    Valid from
                    <input
                      type="datetime-local"
                      value={form.coupon_valid_from}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, coupon_valid_from: e.target.value }))
                      }
                      className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                    Valid until
                    <input
                      type="datetime-local"
                      value={form.coupon_valid_until}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, coupon_valid_until: e.target.value }))
                      }
                      className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                    />
                  </label>
                </div>
              )}

              {submitError && <div className="text-xs text-accent">{submitError}</div>}
              {submitSuccess && <div className="text-xs text-accent">{submitSuccess}</div>}

              <div className="flex gap-3 mt-1">
                <Button variant="primary" onClick={submit} disabled={submitting}>
                  {submitting ? "Saving…" : editingId ? "Save changes" : "Create promotion"}
                </Button>
                {editingId && (
                  <Button variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            <div className="w-[220px] shrink-0 bg-paper border border-border rounded-md p-4">
              <span className="text-xs text-muted block mb-2">LIVE PREVIEW</span>
              <div className="text-sm">{preview.label}</div>
              <div className="text-sm text-accent mt-1.5">
                {"฿"}
                {preview.subtotal.toLocaleString("th-TH")} {"→"} {"฿"}
                {(preview.subtotal - preview.discount).toLocaleString("th-TH")} (save {"฿"}
                {preview.discount.toLocaleString("th-TH")})
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
