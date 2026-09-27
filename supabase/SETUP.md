# Supabase setup

## 1. Create the database tables and policies

In the Supabase dashboard, open **SQL Editor**, paste in `schema.sql`, and run it. This creates the booking, court, blocked-time, and site-setting tables, the public-safe schedule and booking functions, row-level security policies, the public payment QR bucket, and private storage for customer payment screenshots.

If you already ran an older version of `schema.sql`, run `payment-screenshot-migration.sql` in the SQL Editor. It adds the screenshot path column and storage policies, then updates the booking function. Existing bookings remain unchanged.

## 2. Create the admin account

Open **Authentication → Users**, add `systech.solutions.ph@gmail.com`, and set a password for that account. Then run `add-admin.sql` in the SQL Editor. The account must be in `admin_users` for the admin login to work.

## 3. Configure Vercel

Under **Project Settings → Environment Variables**, add these for Production and Preview:

- `VITE_SUPABASE_URL` — the project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the publishable key

The local `.env.local` file is already configured for this project and is excluded from Git. After adding the variables in Vercel, redeploy so the new build receives them.

Customer bookings now require a PNG, JPG, or WEBP payment screenshot under 8 MB. Screenshots are stored privately; only admins can view them in **Payment review**.

Never put a database password or `service_role` key in a `VITE_` variable or in browser code.
