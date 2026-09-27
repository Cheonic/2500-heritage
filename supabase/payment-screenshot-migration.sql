-- Run this once in Supabase SQL Editor if schema.sql was already applied.
-- It adds private payment proof storage and updates the public booking RPC.

alter table public.bookings
  add column if not exists payment_screenshot_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Customers can upload payment screenshots" on storage.objects;
create policy "Customers can upload payment screenshots" on storage.objects
  for insert to anon, authenticated with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] ~ '^2500H-[A-Z0-9]{8,16}$'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  );

drop policy if exists "Admins can view payment screenshots" on storage.objects;
create policy "Admins can view payment screenshots" on storage.objects
  for select to authenticated using (
    bucket_id = 'payment-proofs' and public.is_admin()
  );

drop function if exists public.create_customer_booking(text, text, text, text, text, text, jsonb);

create function public.create_customer_booking(
  p_reference text,
  p_name text,
  p_mobile text,
  p_email text,
  p_sport text,
  p_payment_screenshot_path text,
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
    or length(trim(coalesce(p_payment_screenshot_path, ''))) = 0
    or length(trim(coalesce(p_sport, ''))) = 0 then
    raise exception using errcode = '22023', message = 'Name, mobile, sport, and payment screenshot are required.';
  end if;
  if v_reference !~ '^2500H-[A-Z0-9]{8,16}$' then
    raise exception using errcode = '22023', message = 'Booking reference is invalid.';
  end if;
  if p_payment_screenshot_path !~ ('^' || v_reference || '/[0-9a-f-]{36}\.(jpg|png|webp)$') then
    raise exception using errcode = '22023', message = 'Payment screenshot path is invalid.';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id = 'payment-proofs'
      and name = p_payment_screenshot_path
  ) then
    raise exception using errcode = '22023', message = 'Upload the payment screenshot before submitting the booking.';
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
      reference, payment_reference, payment_screenshot_path, court_id, court_name, sport,
      day_iso, start_hour, end_hour, rate, name, mobile, email,
      source, status
    ) values (
      v_reference,
      null,
      case when v_count = 1 then p_payment_screenshot_path else null end,
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

notify pgrst, 'reload schema';
