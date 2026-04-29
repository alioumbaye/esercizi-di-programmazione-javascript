# Dahira Connect (MVP)

Simple SaaS MVP built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features
- User signup and login
- Create a dahira
- Add members to a dahira
- Track monthly contributions (paid / unpaid)
- Dashboard metrics:
  - total members
  - total contributions
  - unpaid members

## 1) Configure environment
Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2) Supabase SQL schema
Run this in Supabase SQL editor:

```sql
create table if not exists dahiras (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  dahira_id uuid not null references dahiras(id) on delete cascade,
  full_name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  month text not null,
  paid boolean not null default false,
  amount numeric not null default 0
);

alter table dahiras enable row level security;
alter table members enable row level security;
alter table contributions enable row level security;

create policy "users can manage own dahiras" on dahiras
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "users can manage own members" on members
  for all using (
    exists (
      select 1 from dahiras d
      where d.id = members.dahira_id and d.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1 from dahiras d
      where d.id = members.dahira_id and d.created_by = auth.uid()
    )
  );

create policy "users can manage own contributions" on contributions
  for all using (
    exists (
      select 1 from members m
      join dahiras d on d.id = m.dahira_id
      where m.id = contributions.member_id and d.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1 from members m
      join dahiras d on d.id = m.dahira_id
      where m.id = contributions.member_id and d.created_by = auth.uid()
    )
  );
```

## 3) Run
```bash
npm install
npm run dev
```
