create table if not exists public.user_reference_generations (
  record_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data_environment text not null check (data_environment in ('preview', 'production')),
  storage_provider text not null default 'vercel-blob' check (storage_provider = 'vercel-blob'),
  reference_asset_id text not null unique,
  reference_pathname text not null unique,
  reference_width integer not null check (reference_width > 0),
  reference_height integer not null check (reference_height > 0),
  reference_bytes bigint not null check (reference_bytes > 0 and reference_bytes <= 6291456),
  thumbnail_asset_id text not null unique,
  thumbnail_pathname text not null unique,
  thumbnail_width integer not null check (thumbnail_width > 0),
  thumbnail_height integer not null check (thumbnail_height > 0),
  thumbnail_bytes bigint not null check (thumbnail_bytes > 0 and thumbnail_bytes <= 1048576),
  recognition_result jsonb,
  palette text[],
  composition jsonb,
  seed text,
  render_params jsonb,
  matcher_version text not null,
  system_version text not null,
  status text not null default 'recognizing' check (status in ('recognizing', 'ready', 'failed')),
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reference_ready_fields check (
    status <> 'ready'
    or (
      recognition_result is not null
      and palette is not null
      and composition is not null
      and seed is not null
      and render_params is not null
    )
  ),
  constraint user_reference_failed_fields check (status <> 'failed' or failure_code is not null),
  constraint user_reference_path_ownership check (
    reference_pathname = 'users/' || user_id::text || '/references/' || record_id::text || '/reference.webp'
    and thumbnail_pathname = 'users/' || user_id::text || '/references/' || record_id::text || '/thumbnail.webp'
  )
);

create index if not exists user_reference_generations_user_created_idx
  on public.user_reference_generations (data_environment, user_id, created_at desc);

create or replace function public.set_user_reference_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_reference_updated_at on public.user_reference_generations;
create trigger set_user_reference_updated_at
before update on public.user_reference_generations
for each row execute function public.set_user_reference_updated_at();

alter table public.user_reference_generations enable row level security;

drop policy if exists "reference records select own or admin" on public.user_reference_generations;
create policy "reference records select own or admin"
on public.user_reference_generations
for select
to authenticated
using (
  auth.uid() = user_id
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
);

drop policy if exists "reference records insert own" on public.user_reference_generations;
create policy "reference records insert own"
on public.user_reference_generations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reference records update own or admin" on public.user_reference_generations;
create policy "reference records update own or admin"
on public.user_reference_generations
for update
to authenticated
using (
  auth.uid() = user_id
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
)
with check (
  auth.uid() = user_id
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
);

drop policy if exists "reference records delete own or admin" on public.user_reference_generations;
create policy "reference records delete own or admin"
on public.user_reference_generations
for delete
to authenticated
using (
  auth.uid() = user_id
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'super_admin'
);
