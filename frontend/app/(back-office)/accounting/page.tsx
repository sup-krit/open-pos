import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FilterPill from "@/components/ui/Select";
import { Table, Td, Th } from "@/components/ui/Table";

// Sample data — static placeholders for the scaffold.
const transactions = [
  {
    date: "03 ก.ย.",
    description: "PromptPay — OP-1042",
    debit: null,
    credit: "฿3,520",
    balance: "฿212,880",
    category: "Sales",
    status: "Needs review",
  },
  {
    date: "02 ก.ย.",
    description: "Vendor payment — Siam Gems",
    debit: "฿24,000",
    credit: null,
    balance: "฿209,360",
    category: "Inventory",
    status: "Matched",
  },
  {
    date: "02 ก.ย.",
    description: "PromptPay — OP-1039",
    debit: null,
    credit: "฿5,120",
    balance: "฿233,360",
    category: "Sales",
    status: "Needs review",
  },
  {
    date: "01 ก.ย.",
    description: "Shipping — Kerry",
    debit: "฿1,240",
    credit: null,
    balance: "฿228,240",
    category: "Logistics",
    status: "Needs review",
  },
  {
    date: "31 ส.ค.",
    description: "Card settlement",
    debit: null,
    credit: "฿12,900",
    balance: "฿229,480",
    category: "Sales",
    status: "Matched",
  },
  {
    date: "30 ส.ค.",
    description: "Rent",
    debit: "฿18,000",
    credit: null,
    balance: "฿216,580",
    category: "Overhead",
    status: "Matched",
  },
];

export default function AccountingPage() {
  return (
    <>
      <Topbar
        title="Accounting"
        actions={
          <>
            <span className="text-[11px] text-muted italic">PDF · single bank format</span>
            <Button>Upload statement</Button>
          </>
        }
      />
      <div className="p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Monthly summary</span>
          <FilterPill>August 2026 ▾</FilterPill>
        </div>

        <div className="flex gap-4">
          <Card className="p-5 flex flex-col gap-1.5 flex-1">
            <span className="text-[11px] text-muted">INCOME</span>
            <span className="text-[22px] font-semibold">฿186,400</span>
          </Card>
          <Card className="p-5 flex flex-col gap-1.5 flex-1">
            <span className="text-[11px] text-muted">EXPENSE</span>
            <span className="text-[22px] font-semibold">฿108,900</span>
          </Card>
          <Card className="p-5 flex flex-col gap-1.5 flex-1">
            <span className="text-[11px] text-muted">GROSS PROFIT</span>
            <span className="text-[22px] font-semibold">฿77,500</span>
          </Card>
        </div>

        <Card className="pt-2 px-5 pb-5">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Debit</Th>
                <Th>Credit</Th>
                <Th>Balance</Th>
                <Th>Category</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={`${t.date}-${i}`}>
                  <Td>{t.date}</Td>
                  <Td>{t.description}</Td>
                  <Td className={t.debit ? "" : "text-muted"}>{t.debit ?? "—"}</Td>
                  <Td className={t.credit ? "" : "text-muted"}>{t.credit ?? "—"}</Td>
                  <Td>{t.balance}</Td>
                  <Td>{t.category}</Td>
                  <Td>
                    <Badge tone={t.status === "Matched" ? "accent" : "neutral"}>
                      {t.status}
                    </Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <span className="text-[11px] text-muted italic">
          No automatic matching against Orders — reconciliation is manual at launch.
        </span>
      </div>
    </>
  );
}
