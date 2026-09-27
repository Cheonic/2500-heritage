-- Shared booking data for 2500 Heritage.
-- Run this in the Supabase SQL Editor after creating the project.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.courts (
  id text primary key check (id in ('A', 'B', 'C', 'D')),
  name text not null check (length(trim(name)) > 0),
  rate numeric(10, 2) not null check (rate >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null,
  payment_reference text,
  court_id text not null references public.courts (id),
  court_name text not null,
  sport text,
  day_iso date not null,
  start_hour smallint not null check (start_hour >= 8 and start_hour < 24),
  end_hour smallint not null check (end_hour > start_hour and end_hour <= 24),
  rate numeric(10, 2) not null check (rate >= 0),
  name text not null,
  mobile text not null,
  email text,
  notes text,
  source text not null check (source in ('customer', 'admin', 'reclub')),
  status text not null check (status in ('confirmed', 'reserved', 'pending', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_day_court_idx
  on public.bookings (day_iso, court_id, start_hour, end_hour)
  where status <> 'rejected';
create index if not exists bookings_reference_idx on public.bookings (reference);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  court_id text not null references public.courts (id),
  day_iso date not null,
  start_hour smallint not null check (start_hour >= 8 and start_hour < 24),
  end_hour smallint not null check (end_hour > start_hour and end_hour <= 24),
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into public.courts (id, name, rate) values
  ('A', 'Court A — Windward', 600),
  ('B', 'Court B — Leeward', 600),
  ('C', 'Court C — Covered', 600),
  ('D', 'Court D — Covered', 600)
on conflict (id) do nothing;

insert into public.site_settings (key, value)
values ('payment_qr_path', null)
on conflict (key) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.courts enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Admins can read admin list" on public.admin_users;
create policy "Admins can read admin list" on public.admin_users
  for select to authenticated using (public.is_admin());

drop policy if exists "Public can read courts" on public.courts;
create policy "Public can read courts" on public.courts
  for select to anon, authenticated using (true);
drop policy if exists "Admins can manage courts" on public.courts;
create policy "Admins can manage courts" on public.courts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage bookings" on public.bookings;
create policy "Admins can manage bookings" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage blocked slots" on public.blocked_slots;
create policy "Admins can manage blocked slots" on public.blocked_slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "Admins can manage site settings" on public.site_settings;
create policy "Admins can manage site settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.courts, public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.bookings, public.blocked_slots to authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.courts, public.site_settings to authenticated;

-- Public calendar data intentionally omits customer names, contact details,
-- payment references, and booking references.
create or replace function public.get_public_schedule(p_from date, p_to date)
returns table (
  id uuid,
  court_id text,
  day_iso date,
  start_hour smallint,
  end_hour smallint,
  status text,
  source text,
  sport text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_from is null or p_to is null or p_to < p_from then
    raise exception using errcode = '22023', message = 'Choose a valid schedule date range.';
  end if;

  return query
  select b.id, b.court_id, b.day_iso, b.start_hour, b.end_hour, b.status, b.source, b.sport
  from public.bookings b
  where b.day_iso between p_from and p_to
    and b.status <> 'rejected'
  union all
  select s.id, s.court_id, s.day_iso, s.start_hour, s.end_hour, 'blocked'::text, null::text, null::text
  from public.blocked_slots s
  where s.day_iso between p_from and p_to;
end;
$$;

revoke all on function public.get_public_schedule(date, date) from public;
grant execute on function public.get_public_schedule(date, date) to anon, authenticated;

-- Create a customer's complete multi-court booking atomically. Court prices and
-- names are read from the database so the browser cannot alter the charge.
create or replace function public.create_customer_booking(
  p_reference text,
  p_name text,
  p_mobile text,
  p_email text,
  p_sport text,
  p_payment_reference text,
  p_slots jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reference text := upper(trim(coalesce(p_reference, '')));
  v_slot record;
  v_court public.courts%rowtype;
  v_hour integer;
  v_count integer := 0;
begin
  if length(trim(coalesce(p_name, ''))) = 0
    or length(trim(coalesce(p_mobile, ''))) = 0
    or length(trim(coalesce(p_payment_reference, ''))) = 0
    or length(trim(coalesce(p_sport, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Name, mobile, sport, and payment reference are required.';
  end if;
  if v_reference !~ '^2500H-[A-Z0-9]{8,16}$' then
    raise exception using errcode = '22023', message = 'Booking reference is invalid.';
  end if;
  if exists (select 1 from public.bookings where reference = v_reference) then
    raise exception using errcode = '23505', message = 'This booking reference is already in use. Try submitting again.';
  end if;
  if p_slots is null or jsonb_typeof(p_slots) <> 'array' then
    raise exception using errcode = '22023', message = 'Select at least one booking time.';
  end if;
  if jsonb_array_length(p_slots) = 0 then
    raise exception using errcode = '22023', message = 'Select at least one booking time.';
  end if;

  for v_slot in
    select *
    from jsonb_to_recordset(p_slots) as slots(
      court_id text,
      day_iso date,
      start_hour smallint,
      end_hour smallint
    )
    order by court_id, day_iso, start_hour
  loop
    v_count := v_count + 1;
    if v_count > 32
      or v_slot.court_id is null
      or v_slot.day_iso is null
      or v_slot.start_hour is null
      or v_slot.end_hour is null
      or v_slot.day_iso < current_date
      or v_slot.start_hour < 8
      or v_slot.end_hour > 24
      or v_slot.end_hour <= v_slot.start_hour then
      raise exception using errcode = '22023', message = 'One or more selected booking times are invalid.';
    end if;

    select * into v_court from public.courts where id = v_slot.court_id;
    if not found then
      raise exception using errcode = '22023', message = 'Selected court does not exist.';
    end if;

    -- Serialize reservations for every hour in a consistent order to avoid
    -- two customers reserving the same empty slot at the same time.
    for v_hour in v_slot.start_hour..(v_slot.end_hour - 1) loop
      perform pg_advisory_xact_lock(
        hashtextextended(v_slot.court_id || ':' || v_slot.day_iso::text || ':' || v_hour::text, 0)
      );
    end loop;

    if exists (
      select 1 from public.bookings b
      where b.court_id = v_slot.court_id
        and b.day_iso = v_slot.day_iso
        and b.status <> 'rejected'
        and b.start_hour < v_slot.end_hour
        and v_slot.start_hour < b.end_hour
    ) or exists (
      select 1 from public.blocked_slots s
      where s.court_id = v_slot.court_id
        and s.day_iso = v_slot.day_iso
        and s.start_hour < v_slot.end_hour
        and v_slot.start_hour < s.end_hour
    ) then
      raise exception using errcode = '23P01', message = 'That court time is no longer available.';
    end if;

    insert into public.bookings (
      reference, payment_reference, court_id, court_name, sport,
      day_iso, start_hour, end_hour, rate, name, mobile, email,
      source, status
    ) values (
      v_reference,
      case when v_count = 1 then trim(p_payment_reference) else null end,
      v_court.id,
      v_court.name,
      trim(p_sport),
      v_slot.day_iso,
      v_slot.start_hour,
      v_slot.end_hour,
      v_court.rate,
      trim(p_name),
      trim(p_mobile),
      nullif(trim(coalesce(p_email, '')), ''),
      'customer',
      'reserved'
    );
  end loop;

  return v_reference;
end;
$$;

revoke all on function public.create_customer_booking(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.create_customer_booking(text, text, text, text, text, text, jsonb) to anon, authenticated;

-- A customer can retrieve their own booking only when both their reference and
-- phone number match. Admin reads continue to use the protected bookings table.
create or replace function public.lookup_customer_booking(p_reference text, p_mobile text)
returns table (
  id uuid,
  reference text,
  payment_reference text,
  court_id text,
  court_name text,
  sport text,
  day_iso date,
  start_hour smallint,
  end_hour smallint,
  rate numeric,
  name text,
  mobile text,
  email text,
  notes text,
  source text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.reference, b.payment_reference, b.court_id, b.court_name,
    b.sport, b.day_iso, b.start_hour, b.end_hour, b.rate, b.name, b.mobile,
    b.email, b.notes, b.source, b.status, b.created_at
  from public.bookings b
  where upper(b.reference) = upper(trim(p_reference))
    and regexp_replace(b.mobile, '[^0-9]', '', 'g') = regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')
    and length(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')) >= 7
    and b.source = 'customer'
  order by b.day_iso, b.start_hour;
$$;

revoke all on function public.lookup_customer_booking(text, text) from public;
grant execute on function public.lookup_customer_booking(text, text) to anon, authenticated;

-- Payment QR images are public to view, but only authenticated admins may
-- upload, replace, or remove them.
insert into storage.buckets (id, name, public)
values ('payment-qr', 'payment-qr', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view payment QR" on storage.objects;
create policy "Public can view payment QR" on storage.objects
  for select to anon, authenticated using (bucket_id = 'payment-qr');

drop policy if exists "Admins can upload payment QR" on storage.objects;
create policy "Admins can upload payment QR" on storage.objects
  for insert to authenticated with check (bucket_id = 'payment-qr' and public.is_admin());

drop policy if exists "Admins can update payment QR" on storage.objects;
create policy "Admins can update payment QR" on storage.objects
  for update to authenticated using (bucket_id = 'payment-qr' and public.is_admin())
  with check (bucket_id = 'payment-qr' and public.is_admin());

drop policy if exists "Admins can delete payment QR" on storage.objects;
create policy "Admins can delete payment QR" on storage.objects
  for delete to authenticated using (bucket_id = 'payment-qr' and public.is_admin());
