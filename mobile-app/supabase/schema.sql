-- Cybiture mobile app database schema
-- Run this in Supabase SQL Editor after creating your Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null default 'New Cybiture Client',
  plan_name text not null default 'Starter',
  support_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  contact_name text not null,
  business_name text,
  phone text,
  email text,
  source text not null,
  status text not null default 'New',
  value_cents integer not null default 0,
  message text,
  next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  name text not null,
  status text not null default 'Live',
  runs_this_week integer not null default 0,
  tone text not null default 'green',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.setup_tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  label text not null,
  is_done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  request_body text not null,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_profiles(id) on delete cascade,
  title text not null,
  category text not null default 'Workflow approval',
  status text not null default 'Needs review',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_client_created_idx on public.leads (client_id, created_at desc);
create index if not exists automations_client_idx on public.automations (client_id);
create index if not exists setup_tasks_client_sort_idx on public.setup_tasks (client_id, sort_order);
create index if not exists activity_events_client_created_idx on public.activity_events (client_id, created_at desc);
create index if not exists support_requests_client_created_idx on public.support_requests (client_id, created_at desc);
create index if not exists approval_requests_client_created_idx on public.approval_requests (client_id, created_at desc);

alter table public.client_profiles enable row level security;
alter table public.leads enable row level security;
alter table public.automations enable row level security;
alter table public.setup_tasks enable row level security;
alter table public.activity_events enable row level security;
alter table public.support_requests enable row level security;
alter table public.approval_requests enable row level security;

drop policy if exists "Clients can read their profile" on public.client_profiles;
create policy "Clients can read their profile"
on public.client_profiles for select
using (user_id = auth.uid());

drop policy if exists "Clients can update their profile" on public.client_profiles;
create policy "Clients can update their profile"
on public.client_profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Clients can read their leads" on public.leads;
create policy "Clients can read their leads"
on public.leads for select
using (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can update their leads" on public.leads;
create policy "Clients can update their leads"
on public.leads for update
using (client_id in (select id from public.client_profiles where user_id = auth.uid()))
with check (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can read their automations" on public.automations;
create policy "Clients can read their automations"
on public.automations for select
using (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can read their setup tasks" on public.setup_tasks;
create policy "Clients can read their setup tasks"
on public.setup_tasks for select
using (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can update their setup tasks" on public.setup_tasks;
create policy "Clients can update their setup tasks"
on public.setup_tasks for update
using (client_id in (select id from public.client_profiles where user_id = auth.uid()))
with check (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can read activity" on public.activity_events;
create policy "Clients can read activity"
on public.activity_events for select
using (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can create support requests" on public.support_requests;
create policy "Clients can create support requests"
on public.support_requests for insert
with check (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can read support requests" on public.support_requests;
create policy "Clients can read support requests"
on public.support_requests for select
using (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can read approval requests" on public.approval_requests;
create policy "Clients can read approval requests"
on public.approval_requests for select
using (client_id in (select id from public.client_profiles where user_id = auth.uid()));

drop policy if exists "Clients can update approval requests" on public.approval_requests;
create policy "Clients can update approval requests"
on public.approval_requests for update
using (client_id in (select id from public.client_profiles where user_id = auth.uid()))
with check (client_id in (select id from public.client_profiles where user_id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  profile_id uuid;
begin
  insert into public.client_profiles (user_id, business_name, support_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'business_name', 'New Cybiture Client'),
    new.email
  )
  returning id into profile_id;

  insert into public.setup_tasks (client_id, label, is_done, sort_order)
  values
    (profile_id, 'Business profile reviewed', false, 1),
    (profile_id, 'Lead sources connected', false, 2),
    (profile_id, 'Missed-call message approved', false, 3),
    (profile_id, 'Review request template approved', false, 4),
    (profile_id, 'Launch test completed', false, 5);

  insert into public.automations (client_id, name, status, runs_this_week, tone)
  values
    (profile_id, 'Missed-call text-back', 'Scheduled', 0, 'amber'),
    (profile_id, 'Website form follow-up', 'Scheduled', 0, 'amber'),
    (profile_id, 'Review request sequence', 'Scheduled', 0, 'amber');

  insert into public.approval_requests (client_id, title, category, status, body)
  values
    (
      profile_id,
      'Missed-call text-back message',
      'Message approval',
      'Needs review',
      'Hi, this is your business. Sorry we missed your call. What can we help with today?'
    ),
    (
      profile_id,
      'Review request sequence',
      'Workflow approval',
      'Needs review',
      'Send a review request after each completed job, then one polite reminder after 3 days.'
    );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
