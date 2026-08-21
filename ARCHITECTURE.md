# ARCHITECTURE DOCUMENT — PROS E-COMMERCE PLATFORM

This document details the modular system architecture, database design, payment adapter contracts, security rules, and data flows of the official **PROS — PRÉSIDENT OUSMANE SONKO** luxury e-commerce platform.

---

## 🏛️ 1. High-Level Modular Architecture

```text
PROS E-COMMERCE SYSTEM
│
├── 1. Frontend Layer (Next.js / React 18 / Tailwind CSS / Framer Motion)
│     ├── Storefront UI (Hero, Catalogue, Product Detail, Cart, Checkout)
│     ├── Brand Manifesto & Editorial Lookbook Magazine
│     └── Admin Dashboard (KPIs, Product Editor, Order Status Manager)
│
├── 2. Data & ORM Layer (PostgreSQL + Prisma ORM + Supabase)
│     ├── Prisma Schema (20 Relational Models)
│     ├── Row Level Security (RLS) Policies
│     └── Atomic SQL Transactions ($transaction)
│
├── 3. Core Business Services (Server-Side)
│     ├── Checkout Guard (Server-side price & stock verification)
│     ├── Inventory Engine (Atomic stock deduction & reservations)
│     ├── Shipping Engine (Dakar & Senegalese Regional Rates)
│     └── Audit Log Manager (Admin audit trail tracking)
│
└── 4. Payments Adapter Architecture (PaymentManager Registry)
      ├── WavePaymentAdapter (Wave Sénégal API v1)
      ├── OrangeMoneyPaymentAdapter (OM Webpay API v1)
      ├── CreditCardPaymentAdapter (Visa / Mastercard GIM-UEMOA)
      └── CashOnDeliveryAdapter (PAY_ON_DELIVERY)
```

---

## 🔒 2. Critical Business & Security Rules

1. **Rule 1 (Price Guard)**: The client browser never dictates product prices. Final order totals are calculated exclusively on the server using database variant prices.
2. **Rule 2 (Atomic Stock Integrity)**: Variant stocks are checked and updated inside atomic SQL transactions. Stock counts can never become negative.
3. **Rule 3 (Order History Snapshot)**: Order items copy the product title, SKU, unit price, color, and size at the moment of order placement. Catalog price changes never corrupt past order history.
4. **Rule 4 (Payment Idempotency)**: Webhooks verify cryptographic signatures and enforce idempotency using unique transaction IDs.
5. **Rule 5 (Role-Based Access Control)**: Admin routes (`/admin/*`) and admin APIs (`/api/admin/*`) enforce server-side role checks (`ADMIN` / `STAFF`).
6. **Rule 6 (Credential Isolation)**: Secret keys (`WAVE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) reside strictly in `.env` and are never exposed to the client.

---

## 🗄️ 3. Relational Database Schema Highlights

- **`users` & `customer_profiles`**: Authenticated users, roles (`CUSTOMER`, `ADMIN`, `STAFF`), profiles, and saved shipping addresses.
- **`products` & `product_variants`**: Master products with variant matrix (Unique SKU per Product + Color + Size).
- **`carts` & `cart_items`**: Guest session carts merged automatically into user carts upon authentication.
- **`orders` & `order_items`**: Human-readable order numbers (e.g. `PROS-2026-000124`) with status history tracking (`ORDER_STATUS_HISTORY`).
- **`stock_reservations`**: Temporary stock locks during active checkout flows.
- **`payment_transactions`**: Complete audit of payment responses, provider references, and status.
- **`audit_logs`**: System audit trail logging admin edits.

---

## 💳 4. Payment Adapter Interface Contract

Each provider implements the `PaymentProviderAdapter` interface:

```typescript
export interface PaymentProviderAdapter {
  providerName: 'wave' | 'orange_money' | 'card' | 'cash_on_delivery';
  isConfigured(): boolean;
  createPaymentSession(request: PaymentRequest): Promise<PaymentResponse>;
  verifyWebhookSignature(payload: WebhookPayload): boolean;
  handleWebhook(payload: WebhookPayload): Promise<WebhookResult>;
}
```

If credentials are missing from `.env`, adapters safely report status `NOT_CONFIGURED` without crashing or inventing mock transactions.
