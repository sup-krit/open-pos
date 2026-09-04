# Open POS — Requirements Document

Status: Draft v0.2 (single-brand scope, decisions locked)
Source: functional requirements re-derived from a prior internal
back-office project (spec discussion + code review) — restated from
scratch. No code, assets, or naming carried over.
Purpose: **portfolio build** — demonstrates end-to-end product/eng
skill (requirements → diagrams → UX/UI → implementation), not a
system for a specific real business. No real client/brand name
appears anywhere in this repo.

## 1. Overview

Open POS is a point-of-sale and back-office system for a single-brand
retail business selling physical goods with per-unit attributes
(shape/variant, lot, cost). Covers: sell at the counter (POS), manage
stock, manage customers, run promotions, track orders through
fulfillment (incl. shipping label + customer address collection),
and reconcile the books against a bank statement.

## 2. Constraints

- No code, assets, or file structure copied from any prior project.
- No prior brand/company names anywhere in code, docs, or seed data.
- Single brand/store at launch — no cross-brand orders, no per-brand
  tabs, no brand dimension on any entity. (Was multi-brand in the
  reference discussion; explicitly descoped for this build.)

## 3. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) |
| Styling | Tailwind CSS |
| Backend API | Python, FastAPI |
| Database | PostgreSQL |
| DB/Auth/Storage host | Supabase |
| Frontend hosting | Vercel |

Supabase Postgres + Auth + Storage; FastAPI owns business logic that
needs to run outside the DB (promotion engine, order totals, label
generation, bank-statement parsing). Cost note: Supabase Free tier
pauses a project after ~1 week idle — use **Pro ($25/mo)** once this
is a live system, not just dev.

## 4. Modules (functional requirements)

### 4.1 POS / Sell screen
- Target device: **iPhone/iPad, no dedicated POS hardware** (no
  barcode scanner, no receipt printer required). Touch-first layout
  for a small screen.
- Find items by typing name/SKU (camera-based barcode scan is an
  optional nice-to-have, not required).
- Cart: line items (name, unit price, qty, line total), apply
  promotions (auto + manually selectable).
- Choose shipping type (each with its own default cost) and payment
  method (PromptPay QR / card).
- **E-receipt**, not a printed one (no printer on iPad/iPhone).
- Note: iOS PWA has limited background/offline support — don't design
  the sell flow to depend on offline-first behavior.

### 4.2 Orders
- List view with filters (status, date, channel).
- **Add order** (`+ เพิ่มออร์เดอร์`): customer, items picked from
  inventory, shipping type, payment method (QR/Card), total price,
  shipping cost, order date. On submit → success screen with:
  - a copyable **customer address-entry link** (token-based, expiring;
    customer opens it to fill in their own shipping address), and
  - a **payment QR** for the order's exact amount.
- **Edit order** (click a row): full form — items as removable chips,
  tracking number, payment method, totals. Promotion picker recalcs
  product price / discount % / net total live; removable.
- **Status auto-derives**: New Order → Shipped automatically once a
  tracking number is entered (no manual status field).
- **Customer notification hook**: when tracking is entered, offer to
  notify the customer over a messaging channel (e.g. Instagram DM) —
  preview the message before sending. This must be **optional and
  non-blocking**: if the channel/API can't send (e.g. platform's
  24h-reply-window rule, no prior customer contact on record), fall
  back to a "copy message" action instead of blocking order Submit.
- **Shipping label**: print a label for one order from its detail
  view, or select multiple orders from the list and batch-print.
- Footer actions on order edit: shipping label · payment QR · cancel
  · submit.

### 4.3 Inventory / Stock
- **Add a product directly** on the Stock screen — no separate
  spreadsheet-style page required first (see §5, "Price Calc" cut).
- Per-item fields: SKU/id, group/category, variant attribute (shape/
  size/etc.), lot, cost, price, margin %, computed profit, status
  (in stock / low stock / out of stock, auto from threshold), vendor.
- **Custom columns are fully user-defined** — not a fixed field list;
  a user can add a column of a chosen field type (text/number/date/
  select/etc.), not just toggle visibility of preset columns.
- Inline edit: double-click a cell to edit, confirm to save.
- Key identifying columns (e.g. group/variant/lot) stay at a fixed
  width and don't reflow when other columns are added/hidden.
- Filters by group, variant, status, vendor.

### 4.4 Customers
- Fields: name, phone, optional social handle(s) (e.g. Instagram),
  tag (e.g. VIP), total orders, total spent (derived from Orders),
  consent flag for data use (PDPA-style), shipping address (structured
  — sub-district/district/province, not one free-text field).
- Purchase history pulled from Orders, not duplicated on the customer
  record.

### 4.5 Promotions
- Prominent "+ create promotion" action; empty-state shows a
  dashed-border "create new promotion" placeholder card.
- Create/edit form: name, description, status (Active/Inactive),
  condition type (min quantity / min order amount / min quantity of
  one variant), discount type (percent / fixed amount / **BOGO**),
  minimum value, start–end date, priority (higher runs first),
  behavior flags (auto-apply, manually selectable, stackable) — with
  a **live preview box** showing the resulting discount as the form
  is filled in.
- **BOGO** (discount type): buy-qty, get-qty, and get-discount%
  (0–100; 100 = free item). Applies to the same item/variant unless
  configured otherwise. Reuses the existing condition-type field for
  the "buy" trigger (e.g. min quantity).
- **Coupon**: a promotion can require a code, entered by the
  customer/staff at POS or checkout, instead of (or in addition to)
  auto-apply/manual-pick. Fields: coupon code (unique), redemption
  limit (total uses and/or per-customer), current redemption count,
  valid-from/valid-until (independent of the parent promotion's
  active window, since a coupon is usually redeemed later than when
  it's issued).
  A coupon-gated promotion is not auto-applied — it activates only
  when a valid, unexpired, not-exhausted code is entered.
- **Reward coupon (next-visit)**: a promotion can auto-issue a coupon
  to the customer when an order's net total reaches a threshold — the
  issued coupon is redeemable on that customer's *next* order, not the
  current one. Needs: threshold amount (reuses the amount condition
  type), generated code tied to the customer record, and its own
  discount definition (percent/fixed/BOGO) separate from whatever
  discount (if any) applied to the qualifying order.

### 4.6 Accounting
- Upload a **PDF bank statement** (single bank format at launch — no
  multi-bank parser needed yet) → parsed into a transaction ledger:
  date, description, debit, credit, running balance, category,
  reconciliation status (matched / needs review).
- Monthly summary: income, expense, gross profit for a period.
- Out of scope at launch: matching statement lines against Orders
  automatically (manual reconciliation is fine for now).

### 4.7 Print / Labels
- Shared with §4.2 — single-order and batch shipping-label printing
  from the Orders screen. A separate item/price label (for physical
  stock) is a possible future addition, not required at launch.

### 4.8 Dashboard
- At-a-glance sales/orders/stock overview for a selectable time range,
  with period-over-period comparison (e.g. this week vs. last week).
- Designed as a **marketing-analytics surface**, not just an ops
  summary — sections:
  - **Sales trend**: revenue/order-count over time (line/bar), by day/
    week/month.
  - **Top products/categories**: best-sellers by revenue and by unit
    count, worst-sellers (candidates for promotion or clearance).
  - **Customer segments**: new vs. returning customers, VIP-tag
    breakdown, repeat-purchase rate, average order value per segment.
  - **Promotion/coupon performance**: usage count and revenue
    influenced per promotion, including BOGO and reward-coupon
    (§4.5) redemption rate — which promos are actually driving sales.
  - **Channel breakdown**: revenue/order share by order channel
    (walk-in POS vs. online/social, per the `channel` field on Order).
  - **Stock health**: low-stock / out-of-stock item count, inventory
    value.
  - **Geography**: order/revenue breakdown by customer shipping
    province/district (from the structured address in §4.4).
  - **Customer lifetime value (LTV)**: total spend and order count per
    customer over their full history, not just the selected period —
    surfaces top customers regardless of recent activity.
  - **Payment/shipping mix**: order share by payment method (QR/card)
    and shipping type, incl. average shipping cost vs. revenue.
  - **Gross margin**: revenue vs. cost (from Inventory §4.3 cost
    field) by product/category, not just top-line revenue.
- Visual presentation matters here specifically (KPI tiles, charts,
  not just tables) since this is the screen marketing decisions get
  made from — detailed chart/style spec happens in the UX/UI pass
  (§9), not this document.

## 5. Explicitly out of scope at launch

- **CRM / auto-reply module.** Skipped entirely for this build. If
  "auto-reply when the shop is closed" is needed, use the messaging
  platform's own native away-message feature (e.g. Meta Business
  Suite) — no custom inbox/API integration.
- **Payment gateway integration** (Omise/Xendit/etc.). Current volume
  doesn't justify the per-transaction fee; PromptPay QR + attached
  slip + manual reconciliation (§4.6) is sufficient. Revisit only if
  order volume makes manual slip-checking a bottleneck.
- **Price Calc / Excel-like landed-cost sheet.** Cut. Cost and price
  are entered directly on the Stock screen (§4.3) — no separate
  formula-sheet step before an item enters inventory.
- **Multi-bank statement parsing** — one bank format only (§4.6).
- **Multi-brand support** — see §2.

## 6. Core data entities

- **Product / InventoryItem** — sku, name, group, variant attribute,
  lot, cost, price, margin %, profit (computed), status, vendor, plus
  user-defined custom fields (§4.3).
- **Order** — id, created date, channel, customer ref, line items,
  subtotal/shipping/discount/net total, promotion applied, shipping
  type & status, payment method & status, tracking number, address
  checkout token & expiry.
- **Customer** — as in §4.4.
- **Promotion** — as in §4.5.
- **AccountingTransaction** / **AccountingSummary** — as in §4.6.

## 7. Non-functional requirements

- Staff-facing UI in Thai.
- Roles: staff vs. owner/admin at minimum — promotion activation and
  accounting are owner/admin-gated.
- POS screen usable one-handed on iPhone/iPad, no external hardware
  dependency.
- Money handled as integer minor units (e.g. satang) internally.
- Deployable end-to-end: Vercel (frontend) + Supabase (DB/auth) +
  FastAPI (hosted separately — target host TBD).

## 8. Extensibility — other business types

The build target is retail (per-unit goods with shape/lot/cost), but
the engine underneath should not hard-code that domain. Requirement:
a bookstore or restaurant could adopt this system by reconfiguring
fields, not by forking code.

- **Product schema is field-driven, not hard-coded.** §4.3's
  user-defined custom columns are the mechanism — "group / variant
  attribute / lot" are this business's default field set, not fixed
  columns in code. A bookstore config might use Author/ISBN/Genre; a
  restaurant might use Category/Modifiers/Prep-time. Same table
  engine, different field definitions.
- **Promotion condition types stay generic.** "Min quantity of one
  variant" (§4.5) must resolve against *any* configured custom-field
  key, not a hard-coded `shape` column — so "buy 3 of the same
  [configured attribute]" works whether that attribute is shape,
  genre, or dish category.
- **Labels are configurable, not translated hard strings.** Field
  labels shown in the UI (e.g. "variant attribute") should come from
  a per-deployment config/mapping, so relabeling for a different
  business doesn't require touching component code.
- **Out of scope at launch**: business-type-specific modules that go
  beyond generic product/order/promotion (e.g. restaurant table/seat
  management and kitchen-order routing, bookstore ISBN lookup against
  an external catalog). Only the core engine is required to be
  reusable; vertical-specific features are a later, separate build.

## 9. Next steps

1. Diagrams per module (`docs/diagrams/`) — POS sale flow, order
   lifecycle, inventory CRUD, promotion evaluation, address-token
   flow, bank-statement reconciliation, system architecture, ER
   diagram.
2. UX/UI pass (wireframes → high-fidelity), informed by this doc.
3. Only after UX/UI sign-off: begin implementation (Next.js +
   FastAPI + Supabase), fresh code, no reuse from prior projects.
