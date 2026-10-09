# FixMate — Home Services Marketplace 🛠️

FixMate is an on-demand marketplace app for skilled trade services (plumbers, electricians, masons, carpenters, painters, appliance technicians) built for Pakistan.

## 🚀 Tech Stack

- **Framework:** React Native with Expo (SDK 57)
- **Language:** TypeScript (Strict Mode)
- **Navigation:** Expo Router (File-based, role-aware routing)
- **Backend & Auth:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Session Persistence:** `@react-native-async-storage/async-storage`
- **Networking/Polyfill:** `react-native-url-polyfill`
- **Icons:** `@expo/vector-icons` (Ionicons)

---

## 👥 User Roles & Experience

### 1. Customer
- **Welcome & Auth:** Dedicated signup with name, email, phone, and password.
- **Home:** Search bar, urgent booking banner, 6 service category cards, and trust badges.
- **Services:** Filterable catalog with pricing in PKR, service scope, and instant booking.
- **My Orders:** Track active, completed, and cancelled service visits with clear status tags.
- **Profile:** Manage contact details, saved addresses, support, and logout.

### 2. Service Provider
- **Signup:** Select trade (Plumbing, Electrical, Masonry, Carpentry, Painting, Appliance Repair), years of experience, and specialization bio.
- **Dashboard:** Availability switch (Available vs Offline), quick stats (Rating, active jobs, incoming leads, monthly earnings), and urgent requests preview.
- **Job Requests:** Accept or decline incoming customer requests with notes, address, and offered rates.
- **My Jobs:** Track ongoing work, inspect client details, and mark jobs as completed.
- **Profile:** Professional trade badge, rating score, experience record, and logout.

---

## 🗄️ Supabase Setup & Database Schema

### Step 1: Create a Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Save your database password securely.
3. Open **Project Settings → API** and copy your **Project URL** and **anon/publishable key**.

### Step 2: Run the SQL Migration
1. Go to **SQL Editor** in the Supabase Dashboard.
2. Open or copy the contents of [`supabase/schema.sql`](./supabase/schema.sql).
3. Click **Run**. This will create:
   - `profiles` table with `user_role` enum (`customer`, `provider`).
   - `service_providers` table with trade details, rating, and approval status.
   - `services` table pre-seeded with the 6 core categories.
   - `job_orders` table for bookings and order tracking.
   - Database trigger `handle_new_user()` to automatically populate user profiles on signup.
   - Strict **Row Level Security (RLS)** policies preventing unauthorized access and tampering.

### Step 3: Configure `.env`
In the root directory, configure your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-actual-supabase-anon-key
```

> **Note on Local Preview Mode:** If `.env` is not yet configured or contains placeholders, FixMate automatically runs in **Local Preview Mode** with sample data and one-click demo logins so you can preview and test every screen immediately without setup roadblocks!

---

## 📱 How to Run the App

### 1. Start Expo Development Server
```bash
npm start
# or
npx expo start
```

### 2. Test on Your Phone with Expo Go
1. Install **Expo Go** from Google Play Store or Apple App Store.
2. Scan the QR code displayed in your terminal.
3. If on different networks or behind a firewall, use tunnel mode:
```bash
npx expo start --tunnel
```

### 3. Test on Web Browser
```bash
npx expo start --web
```

---

## 📁 Project Architecture

```
project/
├── app/
│   ├── _layout.tsx           # Root stack + AuthProvider
│   ├── index.tsx             # Auth gateway & role redirector
│   ├── modal.tsx             # Info modal
│   ├── (auth)/               # Unauthenticated routes
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx       # Welcome screen with brand & demo access
│   │   ├── login.tsx         # Login with validation & password toggle
│   │   └── signup.tsx        # Customer & Provider signup with trade selector
│   ├── (customer)/           # Customer Tab Navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx         # Customer Home & Category Cards
│   │   ├── services.tsx      # Services Catalog & Pricing
│   │   ├── orders.tsx        # Orders management & empty state
│   │   └── profile.tsx       # Profile & Logout
│   └── (provider)/           # Service Provider Tab Navigation
│       ├── _layout.tsx
│       ├── index.tsx         # Provider Dashboard & Availability toggle
│       ├── requests.tsx      # Job Requests accept/decline
│       ├── jobs.tsx          # Ongoing & Completed jobs
│       └── profile.tsx       # Trade profile & Logout
├── components/
│   ├── Button.tsx            # Accessible themed button
│   ├── Input.tsx             # Form input with icons & toggle
│   ├── Header.tsx            # FixMate branded top bar
│   ├── CategoryCard.tsx      # Service category card
│   ├── EmptyState.tsx        # Meaningful empty state
│   └── StatusBadge.tsx       # Role & status tags
├── constants/
│   ├── Categories.ts         # Predefined trades & categories
│   └── Theme.ts              # Colors, spacing, shadows
├── context/
│   └── AuthContext.tsx       # Session management & role state
├── lib/
│   └── supabase.ts           # Supabase client with AsyncStorage
├── supabase/
│   └── schema.sql            # PostgreSQL schema + RLS policies
├── types/
│   └── index.ts              # TypeScript interfaces
├── .env.example
├── app.json
└── package.json
```
