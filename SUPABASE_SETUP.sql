-- LokalBazaar — Supabase SQL Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query

-- 1. PROFILES TABLE (sellers & buyers)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  phone text,
  shop_name text,
  owner_name text,
  category text,
  city text default 'Jamnagar',
  bio text,
  is_seller boolean default true,
  post_count int default 0,
  follower_count int default 0,
  plan text default 'free',  -- 'free' | 'premium'
  created_at timestamptz default now()
);

-- 2. POSTS TABLE
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references profiles(id) on delete cascade,
  image_url text,
  caption text not null,
  price text,
  available boolean default true,
  like_count int default 0,
  comment_count int default 0,
  created_at timestamptz default now()
);

-- 3. COMMENTS TABLE
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- 4. MESSAGES TABLE (in-app chat)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  text text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 5. POST LIKES TABLE
create table if not exists post_likes (
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

-- -----------------------------------------------
-- ROW LEVEL SECURITY (RLS) — Important!
-- -----------------------------------------------

alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table messages enable row level security;
alter table post_likes enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Public profiles readable" on profiles for select using (true);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Posts: anyone can read, only seller can insert/update/delete
create policy "Public posts readable" on posts for select using (true);
create policy "Sellers can insert posts" on posts for insert with check (auth.uid() = seller_id);
create policy "Sellers can update own posts" on posts for update using (auth.uid() = seller_id);
create policy "Sellers can delete own posts" on posts for delete using (auth.uid() = seller_id);

-- Comments: anyone can read, logged in users can insert
create policy "Public comments readable" on comments for select using (true);
create policy "Users can comment" on comments for insert with check (auth.uid() = user_id);

-- Messages: only sender or receiver can read
create policy "Chat participants can read messages" on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on messages for insert with check (auth.uid() = sender_id);

-- Likes: anyone can read, users can like/unlike
create policy "Likes readable" on post_likes for select using (true);
create policy "Users can like" on post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on post_likes for delete using (auth.uid() = user_id);

-- -----------------------------------------------
-- STORAGE BUCKET — Run separately
-- -----------------------------------------------
-- Go to: Storage → New Bucket
-- Name: product-images
-- Public: YES (toggle on)
-- Then add this policy for uploads:

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Anyone can view product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "Authenticated users can upload" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Users can delete own uploads" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);
