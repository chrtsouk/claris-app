-- ================================================================
-- CLARIS — Complete Database Schema v2
-- Run in: Supabase → SQL Editor → New query → Run
-- ================================================================

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  first_name text, last_name text, full_name text, email text,
  phone text, address text, country text default 'United Kingdom',
  language text default 'en', avatar_url text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, first_name, last_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  status text not null default 'trialing',
  plan text not null default 'pro',
  billing_cycle text not null default 'monthly',
  current_period_end timestamptz default (now() + interval '14 days'),
  trial_end timestamptz default (now() + interval '14 days'),
  stripe_customer_id text, stripe_subscription_id text,
  price_gbp numeric default 10.00,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy "subs_select" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subs_insert" on public.subscriptions for insert with check (auth.uid() = user_id);

create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_profile_sub on public.profiles;
create trigger on_profile_sub after insert on public.profiles
  for each row execute procedure public.handle_new_subscription();

-- FAVOURITES
create table if not exists public.favourites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  tool_id text not null, created_at timestamptz default now(),
  unique(user_id, tool_id)
);
alter table public.favourites enable row level security;
create policy "favs_all" on public.favourites for all using (auth.uid() = user_id);

-- COLLECTIONS
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, emoji text default '📁', description text,
  created_at timestamptz default now()
);
alter table public.collections enable row level security;
create policy "cols_all" on public.collections for all using (auth.uid() = user_id);

create table if not exists public.collection_tools (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade not null,
  tool_id text not null, added_at timestamptz default now(),
  unique(collection_id, tool_id)
);
alter table public.collection_tools enable row level security;
create policy "col_tools_all" on public.collection_tools for all
  using (exists (select 1 from public.collections where id = collection_id and user_id = auth.uid()));

-- NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null default 'info', title text not null, body text,
  read boolean default false, action_url text,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
create policy "notifs_all" on public.notifications for all using (auth.uid() = user_id);

-- PREFERENCES
create table if not exists public.preferences (
  user_id uuid references auth.users(id) on delete cascade primary key,
  theme text default 'dark-gold', language text default 'en',
  compact_view boolean default false, show_ids boolean default true,
  default_page text default 'dashboard',
  notif_new_tools boolean default true, notif_billing boolean default true,
  notif_updates boolean default false, notif_tips boolean default false,
  updated_at timestamptz default now()
);
alter table public.preferences enable row level security;
create policy "prefs_all" on public.preferences for all using (auth.uid() = user_id);

create or replace function public.handle_new_preferences()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.preferences (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;
drop trigger if exists on_profile_prefs on public.profiles;
create trigger on_profile_prefs after insert on public.profiles
  for each row execute procedure public.handle_new_preferences();

-- TOOL VIEWS
create table if not exists public.tool_views (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  tool_id text not null, viewed_at timestamptz default now()
);
alter table public.tool_views enable row level security;
create policy "views_all" on public.tool_views for all using (auth.uid() = user_id);

-- WELCOME NOTIFICATION
create or replace function public.send_welcome_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body)
  values (new.id, 'tip', 'Welcome to CLARIS! 🎉',
    'You now have access to all 3,560 professional tools. Start exploring!');
  return new;
end; $$;
drop trigger if exists on_profile_welcome on public.profiles;
create trigger on_profile_welcome after insert on public.profiles
  for each row execute procedure public.send_welcome_notification();

-- INDEXES
create index if not exists favs_user_idx on public.favourites(user_id);
create index if not exists notifs_user_idx on public.notifications(user_id, read);
create index if not exists views_user_idx on public.tool_views(user_id);
create index if not exists views_tool_idx on public.tool_views(tool_id);

select 'CLARIS schema created successfully ✅' as result;
