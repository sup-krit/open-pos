// Public, no-shell route — opened by a customer from a shared checkout link.
// No sidebar, no auth chrome. Name/phone are already known from the order;
// the customer only fills in the structured shipping address.
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-paper flex justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="font-display italic font-semibold text-xl text-center">
          Open POS
        </div>

        <div className="bg-surface border border-border rounded-md p-5 flex flex-col gap-4">
          <div>
            <span className="text-sm font-semibold block mb-1">ที่อยู่จัดส่ง</span>
            <span className="text-xs text-muted italic">
              Order link token: {token}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              ชื่อผู้รับ
              <span className="h-9 flex items-center px-3 rounded-md border border-border bg-paper text-sm text-ink">
                Nichakan T.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              เบอร์โทร
              <span className="h-9 flex items-center px-3 rounded-md border border-border bg-paper text-sm text-ink">
                081-234-5678
              </span>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-[11px] text-muted">
            บ้านเลขที่ / ที่อยู่
            <input
              placeholder="124/8 ซอย..."
              className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              ตำบล / แขวง
              <input className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface" />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              อำเภอ / เขต
              <input className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface" />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              จังหวัด
              <input className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface" />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              รหัสไปรษณีย์
              <input className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface" />
            </label>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-5 flex flex-col items-center gap-3">
          <span className="text-sm font-semibold self-start">ชำระเงิน</span>
          <div className="w-48 h-48 border border-dashed border-border rounded-md flex items-center justify-center text-xs text-muted bg-paper">
            QR code placeholder
          </div>
          <span className="text-xs text-muted">สแกนเพื่อชำระผ่าน PromptPay</span>
        </div>

        <button
          type="button"
          className="h-12 rounded-lg bg-accent text-white text-sm font-semibold"
        >
          ยืนยันที่อยู่จัดส่ง
        </button>
      </div>
    </div>
  );
}
