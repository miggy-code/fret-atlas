# Database tests

The `Database tests` CI job starts real local Supabase, applies the committed
migrations to a fresh database, then runs every `supabase/tests/*.sql` file with
`psql -X -v ON_ERROR_STOP=1`. Any SQL error fails the job. These are plain SQL
tests, not pgTAP tests; each owns its data and rolls its transaction back.

To reproduce locally, start Docker and install `psql`, then run from the repo root:

```bash
npm exec --yes --package=supabase@3.1.0 -- supabase start -x studio,imgproxy,storage-api,realtime,edge-runtime,logflare,vector
bash -e -o pipefail <<'SQL_TESTS'
for file in supabase/tests/*.sql; do
  echo "Running $file"
  psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -X -v ON_ERROR_STOP=1 -f "$file"
done
SQL_TESTS
npm exec --yes --package=supabase@3.1.0 -- supabase stop --no-backup
```

The final command removes only this local test stack's data volumes. Run it even
if a test fails. A fresh start applies migrations; if you reuse an existing stack,
stop it with `--no-backup` first to reproduce CI's clean database.

No access token, hosted project link, Clerk credentials or GitHub secrets are
needed. Claims are set inside each SQL test to exercise real Supabase roles, JWT
helpers, grants and row-level security. This does not test Clerk token verification
or the HTTP webhook. Nonessential services are excluded to keep startup small.

Keep the pinned CLI version here and in `.github/workflows/ci.yml` in sync when
upgrading. The config explicitly retains Supabase's default public-schema grants
so the permission assertions cannot pass merely because a stand-in lacks them.
