# PROS — PRÉSIDENT OUSMANE SONKO | E-Commerce Platform

Official full-stack e-commerce platform for **PROS — PRÉSIDENT OUSMANE SONKO**.

Built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma ORM, and Supabase.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ & npm
- PostgreSQL database (Supabase, Neon, or local PostgreSQL instance)

### 2. Environment Setup
Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seed
Generate Prisma client and run seed script:

```bash
npx prisma db push
npx prisma db seed
```

### 5. Run Development Server
```bash
npm run dev
```

The application will be running at `http://localhost:3000`.

---

## 🛠️ Tech Stack Overview

- **Frontend**: Next.js App Router, React 18, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Next.js Server-Side APIs, Server Actions, TypeScript.
- **Database**: PostgreSQL with Prisma ORM & Supabase Auth / RLS.
- **Payments**: Payment Adapter Registry (`Wave`, `Orange Money`, `Visa/Mastercard`, `Paiement à la Livraison`).

---

## 📜 Key Commands

- `npm run dev`: Starts local development server.
- `npm run build`: Compiles production build.
- `npx prisma studio`: Opens GUI database explorer.

---

© 2026 PROS — PRÉSIDENT OUSMANE SONKO. All rights reserved.
