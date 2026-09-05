"use client";

// Public, no-shell route — opened by a customer from a shared checkout link.
// No sidebar, no auth chrome. Name/phone are prefilled from the order when
// known; the customer fills in (or completes) the structured shipping address.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { getCheckout, submitCheckoutAddress, type CheckoutRead } from "@/lib/api";

export default function CheckoutPage() {
  const { token } = useParams<{ token: string }>();

  const [data, setData] = useState<CheckoutRead | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subdistrict, setSubdistrict] = useState("");
  const [district, setDistrict] = useState("");
  const [province, setProvince] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getCheckout(token)
      .then((d) => {
        setData(d);
        setName(d.customer.name ?? "");
        setPhone(d.customer.phone ?? "");
      })
      .catch((err) => setLoadError(String(err?.message ?? err)));
  }, [token]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitCheckoutAddress(token, {
        name,
        phone,
        address_subdistrict: subdistrict || null,
        address_district: district || null,
        address_province: province || null,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(String((err as Error)?.message ?? err));
    } finally {
      setSubmitting(false);
    }
  }

  let body: React.ReactNode;

  if (loadError) {
    const message = loadError.includes("404")
      ? "ลิงก์ไม่ถูกต้อง"
      : loadError.includes("410")
        ? "ลิงก์หมดอายุแล้ว"
        : loadError;
    body = (
      <div className="bg-surface border border-border rounded-md p-5">
        <div className="text-xs text-accent">{message}</div>
      </div>
    );
  } else if (!data) {
    body = (
      <div className="bg-surface border border-border rounded-md p-5">
        <span className="text-sm text-muted">กำลังโหลด...</span>
      </div>
    );
  } else if (submitted) {
    body = (
      <div className="bg-surface border border-border rounded-md p-5">
        <span className="text-sm">ขอบคุณค่ะ เราได้รับที่อยู่จัดส่งแล้ว</span>
      </div>
    );
  } else {
    body = (
      <>
        <div className="bg-surface border border-border rounded-md p-5 flex flex-col gap-4">
          <div>
            <span className="text-sm font-semibold block mb-1">ที่อยู่จัดส่ง</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              ชื่อผู้รับ
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-paper"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              เบอร์โทร
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-paper"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              ตำบล / แขวง
              <input
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              อำเภอ / เขต
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[11px] text-muted">
              จังหวัด
              <input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface"
              />
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

        {submitError && <div className="text-xs text-accent">{submitError}</div>}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "กำลังบันทึก..." : "ยืนยันที่อยู่จัดส่ง"}
        </Button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="font-display italic font-semibold text-xl text-center">
          Open POS
        </div>
        {body}
      </div>
    </div>
  );
}
