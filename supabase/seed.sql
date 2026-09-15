-- Diwan administrator seed.
-- Runs after all migrations. Safe to execute repeatedly.
-- Change this one value if the administrator email changes.
do $seed$
declare
  seed_admin_email citext := 'hassnainmaitla313@gmail.com';
begin
  insert into public.admin_accounts (email, status, updated_at)
  values (seed_admin_email, 'active', now())
  on conflict (email) do update
  set status = 'active', updated_at = excluded.updated_at;

  insert into public.author_profile (
    id,
    author_name,
    author_name_urdu,
    pen_name_urdu,
    email,
    biography,
    introduction,
    profile_image,
    updated_at
  )
  values (
    1,
    'Hassnain Raza Maitla',
    'حسنین رضا میتلا',
    'رضاؔ',
    seed_admin_email,
    '',
    '',
    '',
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = excluded.updated_at;
end;
$seed$;

