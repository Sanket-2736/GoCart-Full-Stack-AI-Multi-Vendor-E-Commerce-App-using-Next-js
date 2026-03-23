# GoCart — Multi-Vendor E-Commerce Platform

A full-stack multi-vendor e-commerce platform built with Next.js 15, where buyers can shop across multiple stores, sellers can manage their own storefronts, and admins oversee the entire platform.

---

## Features

**Buyers**
- Browse products across all stores or by individual shop
- Add to cart, apply coupon codes, and checkout via Stripe or Cash on Delivery
- Manage shipping addresses
- Track order status and rate purchased products

**Sellers**
- Apply to open a store (requires admin approval)
- Add and manage products with image uploads via ImageKit
- AI-powered product description generation (Gemini)
- View store analytics, orders, and ratings dashboard

**Admins**
- Approve or reject store applications
- Activate / deactivate stores
- Create and manage coupon codes (with automatic expiry via Inngest)
- View platform-wide analytics dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Lucide React, Recharts |
| State | Redux Toolkit |
| Auth | Clerk |
| Database | PostgreSQL (Neon serverless) via Prisma ORM |
| Payments | Stripe (hosted checkout + webhooks) |
| Image CDN | ImageKit |
| AI | Google Gemini 2.0 Flash |
| Async Events | Inngest |
| Notifications | React Hot Toast |

---

## Project Structure

```
├── app/
│   ├── (public)/          # Buyer-facing pages (home, shop, product, cart, orders)
│   ├── store/             # Seller dashboard (add product, manage products, orders)
│   ├── admin/             # Admin dashboard (approve stores, coupons, analytics)
│   └── api/               # API routes
│       ├── address/       # Shipping address CRUD
│       ├── cart/          # Cart sync
│       ├── coupon/        # Coupon validation
│       ├── orders/        # Order creation & buyer order history
│       ├── products/      # Public product listing
│       ├── rating/        # Product ratings
│       ├── stripe/        # Stripe webhook handler
│       ├── inngest/       # Inngest event handler
│       ├── store/         # Seller-scoped endpoints
│       └── admin/         # Admin-scoped endpoints
├── components/            # Shared UI components
├── lib/
│   ├── prisma.js          # Prisma client singleton
│   ├── store.js           # Redux store
│   └── features/          # Redux slices (cart, product, address, rating)
├── configs/               # ImageKit & OpenAI client configs
├── inngest/               # Inngest client & event functions
├── middlewares/           # authAdmin, authSeller helpers
└── prisma/
    └── schema.prisma      # Database schema
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Clerk](https://clerk.com) application
- A [Stripe](https://stripe.com) account
- An [ImageKit](https://imagekit.io) account
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)
- An [Inngest](https://inngest.com) account

### 1. Clone & Install

```bash
git clone https://github.com/your-username/gocart.git
cd gocart
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

See `.env.example` for the full list of required variables.

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Clerk Webhooks

In your Clerk dashboard, create a webhook pointing to:

```
https://your-domain.com/api/inngest
```

Enable these events: `user.created`, `user.updated`, `user.deleted`

### 5. Stripe Webhooks

In your Stripe dashboard, create a webhook pointing to:

```
https://your-domain.com/api/stripe
```

Enable these events: `payment_intent.succeeded`, `payment_intent.canceled`

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For Inngest event processing locally, run the Inngest dev server in a separate terminal:

```bash
npx inngest-cli@latest dev
```

---

## Database Schema

```
User          — Clerk-synced user record, stores cart as JSON
Store         — Seller storefront (pending → approved)
Product       — Belongs to a Store
Order         — Buyer order, linked to Store + Address
OrderItem     — Join table for Order ↔ Product
Address       — Shipping address per user
Rating        — One rating per user per product per order
Coupon        — Discount codes with optional expiry
```

---

## Authentication & Authorization

- **Buyers** — any authenticated Clerk user
- **Sellers** — authenticated users whose store has `status: "approved"`
- **Admins** — users whose email matches the `ADMIN_EMAIL` env var (comma-separated for multiple admins)

Authorization is enforced server-side in `middlewares/authSeller.js` and `middlewares/authAdmin.js`.

---

## Key API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET/POST | `/api/cart` | Buyer | Sync cart |
| GET/POST | `/api/address` | Buyer | Manage addresses |
| GET/POST | `/api/orders` | Buyer | Place / list orders |
| POST | `/api/coupon` | Buyer | Validate coupon |
| GET/POST | `/api/rating` | Buyer | Submit / fetch ratings |
| GET/POST | `/api/products` | Public | List products |
| POST | `/api/store/create` | Buyer | Apply to open a store |
| GET/POST | `/api/store/product` | Seller | Manage products |
| POST | `/api/store/ai` | Seller | AI description generation |
| GET | `/api/store/orders` | Seller | Fetch store orders |
| POST | `/api/store/orders` | Seller | Update order status |
| GET | `/api/store/dashboard` | Seller | Store analytics |
| GET/POST | `/api/admin/approve-store` | Admin | Approve/reject stores |
| GET/POST/DELETE | `/api/admin/coupon` | Admin | Manage coupons |
| GET | `/api/admin/dashboard` | Admin | Platform analytics |
| POST | `/api/stripe` | Stripe | Payment webhook |
| POST | `/api/inngest` | Inngest | Event handler |

---

## Deployment

The app is designed for [Vercel](https://vercel.com):

```bash
npm run build   # runs prisma generate + next build
npm run start
```

Set all environment variables in your Vercel project settings. Make sure to update your Clerk and Stripe webhook URLs to your production domain.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
