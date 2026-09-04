import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// Sample data — static placeholders for the scaffold.
const promotions = [
  {
    name: "10% off — min 3 items",
    description: "Buy 3+ items → 10% off",
    chips: ["Auto-apply", "Stackable"],
  },
  {
    name: "฿50 off — same variant ×2",
    description: "Buy 2 of same variant → ฿50 off",
    chips: ["Manual"],
  },
  {
    name: "Earrings BOGO",
    description: "Buy 2 get 1 at 50% off",
    chips: ["Auto-apply"],
  },
  {
    name: "CODE: SAVE10",
    description: "10% off — code required",
    chips: ["CODE: SAVE10", "12 / 100 used"],
  },
  {
    name: "Reward — next visit",
    description: "Auto-issued when order ≥ ฿2,000 — redeemable next order",
    chips: ["Auto-issued", "15% off next order"],
  },
];

function Chip({ children }: { children: string }) {
  return (
    <span className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted">
      {children}
    </span>
  );
}

export default function PromotionsPage() {
  return (
    <>
      <Topbar title="Promotions" actions={<Button size="lg">+ Create promotion</Button>} />
      <div className="p-8 flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-4">
          {promotions.map((promo) => (
            <Card key={promo.name} className="p-4 flex flex-col gap-2">
              <span className="text-sm font-semibold">{promo.name}</span>
              <Badge tone="accent">Active</Badge>
              <span className="text-xs text-muted">{promo.description}</span>
              <div className="flex gap-1.5 flex-wrap">
                {promo.chips.map((chip) => (
                  <Chip key={chip}>{chip}</Chip>
                ))}
              </div>
            </Card>
          ))}
          <div className="border border-dashed border-border rounded-md flex items-center justify-center text-sm text-muted min-h-[140px]">
            + Create new promotion
          </div>
        </div>

        <Card className="p-5 flex flex-col">
          <span className="text-sm font-semibold mb-3">Create promotion (example)</span>
          <div className="flex gap-5">
            <div className="flex-1 flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Name
                  <input
                    defaultValue="10% off — min 3 items"
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Status
                  <select
                    defaultValue="active"
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
                  defaultValue="Buy 3 or more items for 10% off the order"
                  className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Condition type
                  <select
                    defaultValue="min-qty"
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  >
                    <option value="min-qty">Min quantity</option>
                    <option value="min-amount">Min order amount</option>
                    <option value="min-variant-qty">Min qty of one variant</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Discount type
                  <select
                    defaultValue="percentage"
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed amount</option>
                    <option value="bogo">BOGO</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Minimum value
                  <input
                    defaultValue="3"
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Priority
                  <input
                    defaultValue="10"
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  Start date
                  <input
                    defaultValue="2026-09-01"
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                  End date
                  <input
                    defaultValue="2026-09-30"
                    className="h-9 rounded-md border border-border px-2.5 text-sm text-ink bg-surface"
                  />
                </label>
              </div>
              <div className="flex gap-4 text-xs items-center">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="w-auto h-auto" /> Auto-apply
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" className="w-auto h-auto" /> Manual
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked className="w-auto h-auto" /> Stackable
                </label>
              </div>
            </div>
            <div className="w-[220px] shrink-0 bg-paper border border-border rounded-md p-4">
              <span className="text-xs text-muted block mb-2">LIVE PREVIEW</span>
              <div className="text-sm">Buy 3 → 10% off</div>
              <div className="text-sm text-accent mt-1.5">
                ฿2,700 → ฿2,430 (save ฿270)
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
