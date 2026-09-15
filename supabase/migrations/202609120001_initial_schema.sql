create extension if not exists pgcrypto;
create extension if not exists citext;

create table public.admin_accounts (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.author_profile (
  id smallint primary key default 1 check (id = 1),
  author_name text not null,
  author_name_urdu text not null,
  pen_name_urdu text not null,
  email citext not null,
  biography text not null default '',
  introduction text not null default '',
  profile_image text not null default '',
  updated_at timestamptz not null default now()
);

create table public.readers (
  id text primary key,
  full_name text not null check (length(trim(full_name)) between 1 and 160),
  username citext not null unique check (length(trim(username::text)) between 3 and 64),
  password_hash text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  device_id text,
  device_name text,
  last_login_at timestamptz,
  token_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index readers_device_id_unique on public.readers(device_id) where device_id is not null;

create table public.books (
  id text primary key,
  title text not null check (length(trim(title)) between 1 and 300),
  cover_type text not null default 'generated' check (cover_type in ('generated', 'custom')),
  cover_url text,
  cover_theme text,
  cover_ornament text,
  status text not null default 'draft' check (status in ('draft', 'coming_soon', 'published')),
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index books_status_order_idx on public.books(status, order_index);
create index books_updated_at_idx on public.books(updated_at);

create table public.writings (
  id text primary key,
  book_id text not null references public.books(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 300),
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index writings_book_order_idx on public.writings(book_id, order_index);
create index writings_updated_at_idx on public.writings(updated_at);

create table public.otp_challenges (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  code_hash text not null,
  attempts integer not null default 0 check (attempts between 0 and 10),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index otp_email_created_idx on public.otp_challenges(email, created_at desc);

create table public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('admin', 'reader')),
  subject_id text not null,
  refresh_token_hash text not null unique,
  token_version integer not null default 0,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index auth_sessions_subject_idx on public.auth_sessions(subject_type, subject_id);
create index auth_sessions_expiry_idx on public.auth_sessions(expires_at) where revoked_at is null;

create table public.sync_changes (
  cursor bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('author', 'book', 'writing')),
  entity_id text not null,
  operation text not null check (operation in ('upsert', 'delete')),
  payload jsonb,
  changed_at timestamptz not null default now()
);

create index sync_changes_cursor_idx on public.sync_changes(cursor);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_type text,
  actor_id text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.record_sync_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into public.sync_changes(entity_type, entity_id, operation)
    values (tg_argv[0], old.id::text, 'delete');
    return old;
  end if;
  insert into public.sync_changes(entity_type, entity_id, operation, payload)
  values (tg_argv[0], new.id::text, 'upsert', to_jsonb(new));
  return new;
end;
$$;

create trigger author_sync_change after insert or update or delete on public.author_profile
for each row execute function public.record_sync_change('author');
create trigger books_sync_change after insert or update or delete on public.books
for each row execute function public.record_sync_change('book');
create trigger writings_sync_change after insert or update or delete on public.writings
for each row execute function public.record_sync_change('writing');

alter table public.admin_accounts enable row level security;
alter table public.author_profile enable row level security;
alter table public.readers enable row level security;
alter table public.books enable row level security;
alter table public.writings enable row level security;
alter table public.otp_challenges enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.sync_changes enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('diwan-media', 'diwan-media', true, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
