-- Verify deletion and replay safety without touching real accounts.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_SyncDeletionTest","role":"authenticated"}', true);
select public.sync_change('initialize');
-- A second account whose data must survive the first one's deletion.
select set_config('request.jwt.claims', '{"sub":"user_SyncNeighbourTest","role":"authenticated"}', true);
select public.sync_change('progress', '{"minor:9:1":2}', 0);
select set_config('request.jwt.claims', '{"sub":"user_SyncDeletionTest","role":"authenticated"}', true);
reset role;
set local role service_role;
select public.sync_delete_clerk_user('user_SyncDeletionTest');
select public.sync_delete_clerk_user('user_SyncDeletionTest');
reset role;
set local role authenticated;
do $$ begin
  begin
    perform public.sync_change('initialize');
    raise exception 'deleted account was recreated';
  exception when invalid_authorization_specification then null;
  end;
end $$;
reset role;
do $$ begin
  if has_function_privilege('authenticated', 'public.sync_delete_clerk_user(text)', 'execute') or
     has_function_privilege('anon', 'public.sync_delete_clerk_user(text)', 'execute') then
    raise exception 'unsafe deletion permission';
  end if;
  if exists (select 1 from public.sync_data where user_id = 'user_SyncDeletionTest') then
    raise exception 'application data was not deleted';
  end if;
  if not exists (select 1 from public.sync_data where user_id = 'user_SyncNeighbourTest' and progress = '{"minor:9:1":2}') then
    raise exception 'deleting one account removed another account''s data';
  end if;
end $$;
rollback;
