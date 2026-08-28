-- ONE STROKE CLUB / Supabase production-ready starter schema
-- Run this in Supabase SQL Editor AFTER enabling Email confirmation in Auth settings.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'OSC MEMBER',
  phone text,
  heard_from text,
  interest text,
  preferred_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_no text not null unique,
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  status text not null default '待付款',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null,
  product_name text not null,
  size text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points integer not null,
  source text not null,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  amount integer not null check (amount > 0),
  min_spend integer not null default 0 check (min_spend >= 0),
  used_at timestamptz,
  used_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, code)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.community_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_osc_member()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id,name,heard_from,interest,preferred_size)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name','OSC MEMBER'),
    new.raw_user_meta_data->>'heard_from',
    new.raw_user_meta_data->>'interest',
    new.raw_user_meta_data->>'preferred_size'
  )
  on conflict (id) do update set
    name=excluded.name,
    heard_from=excluded.heard_from,
    interest=excluded.interest,
    preferred_size=excluded.preferred_size,
    updated_at=now();

  insert into public.coupons (user_id,code,amount,min_spend)
  values (new.id,'OSC200',200,1000)
  on conflict (user_id,code) do nothing;

  insert into public.notifications (user_id,title,body)
  values (new.id,'歡迎加入 ONE STROKE CLUB','你的 OSC200 新會員券已加入帳戶：單筆滿 NT$1,000 折 NT$200。');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_osc_member();

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.points_ledger enable row level security;
alter table public.coupons enable row level security;
alter table public.notifications enable row level security;
alter table public.community_subscribers enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles for select using (auth.uid()=id);
drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update using (auth.uid()=id) with check (auth.uid()=id);

drop policy if exists "favorites own all" on public.favorites;
create policy "favorites own all" on public.favorites for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists "orders own select" on public.orders;
create policy "orders own select" on public.orders for select using (auth.uid()=user_id);
drop policy if exists "orders own insert" on public.orders;
create policy "orders own insert" on public.orders for insert with check (auth.uid()=user_id);

drop policy if exists "order_items own select" on public.order_items;
create policy "order_items own select" on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_items.order_id and o.user_id=auth.uid()));
drop policy if exists "order_items own insert" on public.order_items;
create policy "order_items own insert" on public.order_items for insert with check (exists(select 1 from public.orders o where o.id=order_items.order_id and o.user_id=auth.uid()));

drop policy if exists "points own select" on public.points_ledger;
create policy "points own select" on public.points_ledger for select using (auth.uid()=user_id);
drop policy if exists "points own insert" on public.points_ledger;
create policy "points own insert" on public.points_ledger for insert with check (auth.uid()=user_id);

drop policy if exists "coupons own select" on public.coupons;
create policy "coupons own select" on public.coupons for select using (auth.uid()=user_id);
drop policy if exists "coupons own update" on public.coupons;
create policy "coupons own update" on public.coupons for update using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists "notifications own all" on public.notifications;
create policy "notifications own all" on public.notifications for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Public newsletter signup: insert only, no public read.
drop policy if exists "community public insert" on public.community_subscribers;
create policy "community public insert" on public.community_subscribers for insert with check (true);

-- Recommended: set Auth > Email > Confirm email = ON.
-- Supabase Auth sends the verification email. Customize the confirmation email template
-- to include: "歡迎加入 ONE STROKE CLUB" and "新會員優惠碼 OSC200，滿 NT$1,000 折 NT$200".
