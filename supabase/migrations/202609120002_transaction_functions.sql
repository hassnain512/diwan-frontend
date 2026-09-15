create or replace function public.claim_reader_device(p_reader_id text, p_device_id text, p_device_name text)
returns public.readers language plpgsql security definer set search_path = public as $$
declare selected public.readers;
begin
  select * into selected from public.readers where id = p_reader_id for update;
  if selected.id is null then raise exception 'Reader not found'; end if;
  if selected.device_id is not null and selected.device_id <> p_device_id then
    raise exception using message = 'DEVICE_LOCKED', errcode = 'P0001';
  end if;
  update public.readers set device_id = p_device_id, device_name = p_device_name, last_login_at = now(), updated_at = now()
  where id = p_reader_id returning * into selected;
  return selected;
end;
$$;

create or replace function public.reorder_writings(p_book_id text, p_ordered_ids text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from unnest(p_ordered_ids) id left join public.writings w on w.id = id and w.book_id = p_book_id where w.id is null) then
    raise exception 'Invalid writing order';
  end if;
  update public.writings w set order_index = ordering.position - 1, updated_at = now()
  from unnest(p_ordered_ids) with ordinality as ordering(id, position)
  where w.id = ordering.id and w.book_id = p_book_id;
end;
$$;

create or replace function public.restore_library_snapshot(p_author jsonb, p_books jsonb, p_writings jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.writings;
  delete from public.books;
  delete from public.author_profile;
  insert into public.author_profile select * from jsonb_populate_record(null::public.author_profile, p_author);
  insert into public.books select * from jsonb_populate_recordset(null::public.books, p_books);
  insert into public.writings select * from jsonb_populate_recordset(null::public.writings, p_writings);
end;
$$;

grant execute on function public.claim_reader_device(text, text, text) to service_role;
grant execute on function public.reorder_writings(text, text[]) to service_role;
grant execute on function public.restore_library_snapshot(jsonb, jsonb, jsonb) to service_role;
