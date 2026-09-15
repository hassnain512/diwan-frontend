revoke execute on function public.record_sync_change() from public, anon, authenticated;
revoke execute on function public.claim_reader_device(text, text, text) from public, anon, authenticated;
revoke execute on function public.reorder_writings(text, text[]) from public, anon, authenticated;
revoke execute on function public.restore_library_snapshot(jsonb, jsonb, jsonb) from public, anon, authenticated;

create or replace function public.consume_admin_otp(p_email citext, p_code_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare challenge public.otp_challenges;
begin
  select * into challenge from public.otp_challenges
  where email = p_email and consumed_at is null
  order by created_at desc limit 1 for update;
  if challenge.id is null or challenge.expires_at <= now() or challenge.attempts >= 5 then return false; end if;
  if challenge.code_hash <> p_code_hash then
    update public.otp_challenges set attempts = attempts + 1 where id = challenge.id;
    return false;
  end if;
  update public.otp_challenges set consumed_at = now() where id = challenge.id;
  return true;
end;
$$;

revoke execute on function public.consume_admin_otp(citext, text) from public, anon, authenticated;
grant execute on function public.consume_admin_otp(citext, text) to service_role;
