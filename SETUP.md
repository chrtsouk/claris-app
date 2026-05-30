# CLARIS — Setup Guide

## Βήμα 1: Supabase (Backend / Auth / Database) — ΔΩΡΕΑΝ

1. Πήγαινε στο **https://supabase.com** και κάνε Sign Up (δωρεάν)
2. Κλικ **"New project"**
3. Δώσε όνομα: `claris-app`, επίλεξε region: `West EU (Ireland)`
4. Περίμενε ~2 λεπτά να φτιαχτεί

### Βάλε το database schema:
5. Στο Supabase dashboard → **SQL Editor** → **New query**
6. Copy-paste το περιεχόμενο του αρχείου `supabase-schema.sql`
7. Κλικ **Run**

### Πάρε τα credentials:
8. Supabase → **Settings** → **API**
9. Αντέγραψε το **Project URL** και το **anon public** key

## Βήμα 2: Ρύθμισε το .env

1. Στον φάκελο `claris-app`, αντέγραψε το `.env.example` σε `.env`:
```bash
cp .env.example .env
```

2. Άνοιξε το `.env` με TextEdit (Mac) ή Notepad (Windows) και βάλε τα credentials:
```
VITE_SUPABASE_URL=https://XXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## Βήμα 3: Ενεργοποίησε Google Login (προαιρετικό)

1. Supabase → **Authentication** → **Providers** → **Google**
2. Ακολούθησε τις οδηγίες για Google OAuth credentials

## Βήμα 4: Τρέξε την εφαρμογή

```bash
npm install
npm run dev
```

Άνοιξε: **http://localhost:5173**

---

## Βήμα 5: Stripe (Πληρωμές) — Αργότερα

Όταν είσαι έτοιμος για πληρωμές:
1. **https://stripe.com** → Sign Up (δωρεάν)
2. Δημιούργησε product: "CLARIS Pro" — £10/month και £100/year
3. Χρησιμοποίησε Stripe Checkout για το subscription flow

---

## Stack Summary

| Service     | Κόστος | Για τι           |
|-------------|--------|------------------|
| React+Vite  | £0     | Frontend app     |
| Supabase    | £0     | Auth + Database  |
| Vercel      | £0     | Web hosting      |
| Stripe      | 1.4%+20p per transaction | Payments |

**Συνολικό κόστος εκκίνησης: £0**
