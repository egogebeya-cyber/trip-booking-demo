# Trip Explorer — Booking Website

Full-stack trip booking website built with TanStack Start, React 19, SQLite, and Drizzle ORM.

**Addis Tech demo:** see [DEPLOY.md](./DEPLOY.md) — GitHub + Render free (same flow as EIS).

## Features

- Trip browsing with search, filters, categories, and compare
- Rich trip pages (gallery, itinerary, inclusions, map, FAQ, reviews)
- Booking flow with availability, add-ons, promo codes, deposits, and payments
- Customer accounts (bookings, wishlist, profile)
- Contact, newsletter, WhatsApp, blog, FAQ, legal pages
- Multi-language (English + Amharic)
- Admin panel for trips, bookings, content, and settings

## Quick Start

```bash
npm install
npm run db:push
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tripexplorer.com | admin123 |
| Customer | customer@example.com | customer123 |

## Scripts

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start` — Run production server
- `npm run db:push` — Apply database schema
- `npm run db:studio` — Open Drizzle Studio

## Environment

Copy `.env.example` to `.env`. For real email (bookings, contact, password reset):

1. Open **Admin → Settings → Outgoing email**
2. For Gmail use host `smtp.gmail.com`, port `587`, your Gmail address, and a Google **App Password**
3. Click **Save SMTP and send test email**

You can also set `SMTP_*` or `RESEND_API_KEY` in `.env`.
