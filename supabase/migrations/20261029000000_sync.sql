-- Clerk IDs are text. Only the verified JWT subject identifies a row's owner.
create table public.sync_data (
  user_id text primary key,
  settings jsonb not null default '{}'::jsonb,
  settings_revision bigint not null default 0,
  progress jsonb not null default '{}'::jsonb,
  reset_generation bigint not null default 0
);
alter table public.sync_data enable row level security;
revoke all on public.sync_data from anon, authenticated;
grant select on public.sync_data to authenticated;
create policy "read own sync data" on public.sync_data for select to authenticated
  using (user_id = (select auth.jwt()->>'sub'));

create schema if not exists sync_private;
revoke all on schema sync_private from public;
grant usage on schema sync_private to authenticated;

-- All mutations lock one user row and obtain identity from the verified token.
create function sync_private.change_data(operation text, data jsonb, expected bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  subject text := auth.jwt()->>'sub';
  current_row public.sync_data%rowtype;
  item record;
  merged jsonb;
begin
  if subject is null or subject = '' then raise exception 'Authentication required' using errcode = '28000'; end if;
  if operation not in ('initialize', 'settings', 'progress', 'reset') then raise exception 'Invalid operation'; end if;
  if operation in ('settings', 'progress') and (data is null or jsonb_typeof(data) <> 'object' or octet_length(data::text) > 100000) then raise exception 'Invalid data'; end if;
  if operation in ('settings', 'progress', 'reset') and (expected is null or expected < 0) then raise exception 'Invalid revision'; end if;
  insert into public.sync_data(user_id) values(subject) on conflict do nothing;
  select * into current_row from public.sync_data where user_id = subject for update;
  if operation = 'settings' then
    if current_row.settings_revision <> expected then return jsonb_build_object('status', 'conflict', 'row', to_jsonb(current_row)); end if;
    update public.sync_data set settings = data, settings_revision = settings_revision + 1 where user_id = subject returning * into current_row;
  elsif operation = 'progress' then
    if current_row.reset_generation <> expected then return jsonb_build_object('status', 'reset_conflict', 'row', to_jsonb(current_row)); end if;
    merged := current_row.progress;
    for item in select key, value from jsonb_each(data) loop
      if item.key !~ '^(minor|major):([0-9]|1[01]):[1-5]$' or item.value not in ('1'::jsonb, '2'::jsonb) then raise exception 'Invalid progress'; end if;
      if coalesce((merged->>item.key)::int, 0) < (item.value::text)::int then merged := jsonb_set(merged, array[item.key], item.value, true); end if;
    end loop;
    update public.sync_data set progress = merged where user_id = subject returning * into current_row;
  elsif operation = 'reset' then
    if current_row.reset_generation <> expected then return jsonb_build_object('status', 'reset_conflict', 'row', to_jsonb(current_row)); end if;
    update public.sync_data set progress = '{}'::jsonb, reset_generation = reset_generation + 1 where user_id = subject returning * into current_row;
  end if;
  return jsonb_build_object('status', 'ok', 'row', to_jsonb(current_row));
end $$;
revoke all on function sync_private.change_data(text, jsonb, bigint) from public, anon;
grant execute on function sync_private.change_data(text, jsonb, bigint) to authenticated;

-- Exposed wrapper runs with caller privileges; the private function checks identity.
create function public.sync_change(operation text, data jsonb default null, expected bigint default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select sync_private.change_data(operation, data, expected)
$$;
revoke all on function public.sync_change(text, jsonb, bigint) from public, anon;
grant execute on function public.sync_change(text, jsonb, bigint) to authenticated;
