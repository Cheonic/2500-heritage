-- Run after creating the admin user under Supabase Authentication > Users.
-- Replace the email below if you want a different admin account.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('systech.solutions.ph@gmail.com')
on conflict (user_id) do nothing;
