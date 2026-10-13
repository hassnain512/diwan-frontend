create or replace function public.move_writing(p_writing_id text, p_destination_book_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_writing public.writings;
  destination_order integer;
begin
  select * into current_writing
  from public.writings
  where id = p_writing_id
  for update;

  if current_writing.id is null then
    raise exception 'WRITING_NOT_FOUND';
  end if;
  if not exists (select 1 from public.books where id = p_destination_book_id) then
    raise exception 'BOOK_NOT_FOUND';
  end if;
  if current_writing.book_id = p_destination_book_id then
    return;
  end if;

  -- Close the gap left in the original collection.
  update public.writings
  set order_index = order_index - 1,
      updated_at = now()
  where book_id = current_writing.book_id
    and order_index > current_writing.order_index;

  -- Append the same poem record to the destination collection.
  select coalesce(max(order_index) + 1, 0)
  into destination_order
  from public.writings
  where book_id = p_destination_book_id;

  update public.writings
  set book_id = p_destination_book_id,
      order_index = destination_order,
      updated_at = now()
  where id = p_writing_id;
end;
$$;

revoke execute on function public.move_writing(text, text) from public, anon, authenticated;
grant execute on function public.move_writing(text, text) to service_role;
