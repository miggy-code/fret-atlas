-- Run against a development database; all test data is rolled back.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"sync-test-a","role":"authenticated"}', true);
do $$
declare result jsonb;
begin
  result := public.sync_change('settings', '{"theme":"dark"}', 0);
  if result->>'status' <> 'ok' then raise exception 'settings write failed'; end if;
  result := public.sync_change('settings', '{"theme":"light"}', 0);
  if result->>'status' <> 'conflict' then raise exception 'stale settings must conflict'; end if;
  result := public.sync_change('progress', '{"minor:9:1":2}', 0);
  if result->'row'->'progress'->>'minor:9:1' <> '2' then raise exception 'progress write failed'; end if;
  result := public.sync_change('progress', '{"minor:9:1":1}', 0);
  if result->'row'->'progress'->>'minor:9:1' <> '2' then raise exception 'progress decreased'; end if;
  result := public.sync_change('reset', null, 0);
  if result->'row'->>'reset_generation' <> '1' then raise exception 'reset failed'; end if;
  result := public.sync_change('progress', '{"minor:9:1":2}', 0);
  if result->>'status' <> 'reset_conflict' then raise exception 'stale progress must conflict'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"sync-test-b","role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from public.sync_data) then raise exception 'another account can see data'; end if;
end $$;
reset role;
do $$ begin
  if has_table_privilege('anon', 'public.sync_data', 'select') or
    has_function_privilege('anon', 'public.sync_change(text,jsonb,bigint)', 'execute') or
    has_table_privilege('authenticated', 'public.sync_data', 'update') then
    raise exception 'unsafe permissions';
  end if;
end $$;
rollback;
