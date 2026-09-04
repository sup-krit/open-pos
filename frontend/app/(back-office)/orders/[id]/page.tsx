import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// Sample data — the line items shown for any order id in this scaffold.
const lineItems = [
  { name: "Round-cut pendant", qty: 1, price: "฿890" },
  { name: "Studded hoop earrings", qty: 2, price: "฿840" },
  { name: "Layered chain bracelet", qty: 1, price: "฿650" },
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Topbar
        title={`Order ${id}`}
        actions={
          <>
            <Badge tone="accent">ชำระแล้ว</Badge>
            <Badge tone="ink">Shipped</Badge>
          </>
        }
      />
      <div className="p-8 flex flex-col gap-6 max-w-4xl">
        <Card className="p-5 flex flex-col">
          <span className="text-sm font-semibold mb-3">Line items</span>
          <div className="flex flex-col gap-2">
            {lineItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 bg-paper"
              >
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs text-muted">× {item.qty}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">{item.price}</span>
                  <span
                    aria-hidden
                    className="w-5 h-5 flex items-center justify-center rounded-full border border-border text-muted text-xs"
                  >
                    ×
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-6">
          <Card className="p-5 flex flex-col gap-4 flex-1">
            <span className="text-sm font-semibold">Fulfillment</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Customer
                <span className="h-9 flex items-center px-3 rounded-md border border-border bg-paper text-sm text-ink">
                  Nichakan T.
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Tracking number
                <input
                  defaultValue="TH482910"
                  className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Payment method
                <select
                  defaultValue="qr"
                  className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
                >
                  <option value="qr">QR / PromptPay</option>
                  <option value="card">Card</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Shipping type
                <select
                  defaultValue="normal"
                  className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
                >
                  <option value="normal">Normal — ฿45</option>
                  <option value="express">Express — ฿90</option>
                </select>
              </label>
            </div>

            <span className="text-sm font-semibold mt-2">Promotion</span>
            <div className="flex items-center justify-between gap-3">
              <Badge tone="accent">Auto: 10% off applied</Badge>
              <Button variant="secondary" size="sm">
                Select promotion
              </Button>
            </div>
          </Card>

          <Card className="p-5 flex flex-col w-[280px] shrink-0">
            <span className="text-sm font-semibold mb-1">Totals</span>
            <div className="flex justify-between text-[13px] py-1">
              <span>Subtotal</span>
              <span>฿2,380</span>
            </div>
            <div className="flex justify-between text-[13px] py-1">
              <span>Discount</span>
              <span>−฿238</span>
            </div>
            <div className="flex justify-between text-[13px] py-1">
              <span>Shipping</span>
              <span>฿45</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 mt-1 border-t border-border">
              <span>Net total</span>
              <span>฿2,187</span>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-5">
          <div className="flex gap-3">
            <Button variant="secondary">Shipping label</Button>
            <Button variant="secondary">Payment QR</Button>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost">Cancel order</Button>
            <Button variant="primary">Submit</Button>
          </div>
        </div>
      </div>
    </>
  );
}
