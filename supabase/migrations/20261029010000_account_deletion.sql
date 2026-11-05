-- A hash tombstone blocks still-valid tokens from recreating deleted data.
create table sync_private.deleted_users (
  user_hash text primary key,
  deleted_at timestamptz not null default now()
);
revoke all on sync_private.deleted_users from public, anon, authenticated;

create or replace function sync_private.change_data(operation text, data jsonb, expected bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  subject text := auth.jwt()->>'sub';
  current_row public.sync_data%rowtype;
  item record;
  merged jsonb;
begin
  if subject is null or subject = '' then raise exception 'Authentication required' using errcode = '28000'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(subject, 0));
  if exists (select 1 from sync_private.deleted_users where user_hash = pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(subject, 'UTF8')), 'hex')) then raise exception 'Account deleted' using errcode = '28000'; end if;
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

-- The verified Clerk deletion webhook invokes this via the service role only.
create function sync_private.delete_clerk_user(subject text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if subject is null or subject !~ '^user_[A-Za-z0-9]+$' then raise exception 'Invalid user'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(subject, 0));
  insert into sync_private.deleted_users(user_hash)
    values (pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(subject, 'UTF8')), 'hex'))
    on conflict do nothing;
  delete from public.sync_data where user_id = subject;
end $$;
revoke all on function sync_private.delete_clerk_user(text) from public, anon, authenticated;
grant usage on schema sync_private to service_role;
grant execute on function sync_private.delete_clerk_user(text) to service_role;
create function public.sync_delete_clerk_user(subject text)
returns void language sql security invoker set search_path = '' as $$
  select sync_private.delete_clerk_user(subject)
$$;
revoke all on function public.sync_delete_clerk_user(text) from public, anon, authenticated;
grant execute on function public.sync_delete_clerk_user(text) to service_role;
