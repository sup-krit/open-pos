import Badge from "@/components/ui/Badge";

// Sample data — static cart placeholder for the scaffold.
const quickAdd = [
  { name: "Round-cut pendant", price: "฿890" },
  { name: "Studded hoop earrings", price: "฿420" },
  { name: "Layered chain bracelet", price: "฿650" },
];

const cart = [
  { name: "Round-cut pendant", unitPrice: "฿890 / unit", qty: 1, lineTotal: "฿890" },
  { name: "Studded hoop earrings", unitPrice: "฿420 / unit", qty: 2, lineTotal: "฿840" },
  { name: "Layered chain bracelet", unitPrice: "฿650 / unit", qty: 1, lineTotal: "฿650" },
];

export default function PosPage() {
  return (
    <>
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-surface">
        <h1 className="font-display italic font-semibold text-lg m-0">Sell</h1>
        <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
          e-receipt
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        <div className="h-[46px] rounded-lg border border-border bg-surface px-3.5 flex items-center text-sm text-muted">
          ค้นหาชื่อสินค้า หรือ SKU
        </div>

        <div>
          <span className="text-[13px] font-semibold block mb-2">Results</span>
          <div className="flex gap-2.5 overflow-x-auto">
            {quickAdd.map((item) => (
              <div
                key={item.name}
                className="shrink-0 w-[120px] rounded-lg border border-border bg-surface p-2.5 flex flex-col gap-1.5"
              >
                <span className="text-xs font-medium">{item.name}</span>
                <span className="text-xs text-muted">{item.price}</span>
                <button
                  type="button"
                  aria-label={`Add ${item.name}`}
                  className="self-end w-11 h-11 -m-1 rounded-md bg-accent text-white flex items-center justify-center text-base font-semibold"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <span className="text-[13px] font-semibold block mb-1">Cart</span>
          {cart.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-2.5 py-2.5 border-b border-border last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium">{row.name}</div>
                <div className="text-[11px] text-muted">{row.unitPrice}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease ${row.name}`}
                  className="w-11 h-11 rounded-md border border-border bg-surface text-sm"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm">{row.qty}</span>
                <button
                  type="button"
                  aria-label={`Increase ${row.name}`}
                  className="w-11 h-11 rounded-md border border-border bg-surface text-sm"
                >
                  +
                </button>
              </div>
              <div className="text-sm font-medium w-14 text-right">{row.lineTotal}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2.5">
          <Badge tone="accent">Auto: 10% off applied</Badge>
          <button
            type="button"
            className="h-11 px-3 rounded-md border border-ink text-xs flex items-center"
          >
            Select promotion
          </button>
        </div>

        <div className="rounded-lg border border-border bg-surface px-3 py-2.5 flex flex-col gap-0.5">
          <span className="text-[10px] text-muted">Shipping type</span>
          <span className="text-[13px] font-medium">Normal — ฿45 ▾</span>
        </div>

        <div className="flex border border-border rounded-lg overflow-hidden">
          <button type="button" className="flex-1 py-3 text-sm font-medium bg-accent text-white">
            QR
          </button>
          <button type="button" className="flex-1 py-3 text-sm">
            Card
          </button>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 flex flex-col gap-1">
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
        </div>
      </div>

      <span className="text-[10px] text-muted italic px-4 pb-2">
        iOS PWA has limited offline support — this flow assumes connectivity.
      </span>

      <div className="sticky bottom-0 bg-surface border-t border-border p-3">
        <button
          type="button"
          className="w-full h-[50px] rounded-lg bg-accent text-white text-[15px] font-semibold"
        >
          ยืนยันการขาย
        </button>
      </div>
    </>
  );
}
