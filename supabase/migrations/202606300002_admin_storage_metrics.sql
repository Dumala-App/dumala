create table if not exists public.admin_storage_snapshots (
  snapshot_date date primary key default current_date,
  total_bytes bigint not null default 0,
  table_bytes bigint not null default 0,
  index_bytes bigint not null default 0,
  top_tables jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_storage_snapshots_set_updated_at
before update on public.admin_storage_snapshots
for each row execute function public.set_updated_at();

alter table public.admin_storage_snapshots enable row level security;

create policy "owners with mfa can read storage snapshots"
on public.admin_storage_snapshots for select to authenticated
using (
  public.is_app_admin_role(array['owner']::public.app_admin_role[])
  and public.is_admin_mfa_verified()
);

create or replace function public.get_admin_storage_metrics_v1(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  window_days integer := greatest(1, least(coalesce(days, 30), 365));
  current_total_bytes bigint := 0;
  current_table_bytes bigint := 0;
  current_index_bytes bigint := 0;
  table_rows jsonb := '[]'::jsonb;
  top_table_rows jsonb := '[]'::jsonb;
  trend_rows jsonb := '[]'::jsonb;
  warnings jsonb := '[]'::jsonb;
  previous_total_bytes bigint;
  largest_table_bytes bigint := 0;
begin
  perform public.require_owner_admin_mfa('get_admin_storage_metrics_v1', 'admin_storage_snapshots');

  with table_sizes as (
    select
      c.relname as table_name,
      greatest(c.reltuples, 0)::bigint as row_estimate,
      pg_total_relation_size(c.oid)::bigint as total_bytes,
      pg_relation_size(c.oid)::bigint as table_bytes,
      pg_indexes_size(c.oid)::bigint as index_bytes
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  ),
  totals as (
    select
      coalesce(sum(total_bytes), 0)::bigint as total_bytes,
      coalesce(sum(table_bytes), 0)::bigint as table_bytes,
      coalesce(sum(index_bytes), 0)::bigint as index_bytes
    from table_sizes
  ),
  ranked as (
    select
      table_name,
      row_estimate,
      total_bytes,
      table_bytes,
      index_bytes,
      case
        when (select total_bytes from totals) > 0
          then round((total_bytes::numeric / (select total_bytes from totals)::numeric) * 100, 1)
        else 0
      end as total_percent
    from table_sizes
  )
  select
    totals.total_bytes,
    totals.table_bytes,
    totals.index_bytes,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'tableName', ranked.table_name,
        'rowEstimate', ranked.row_estimate,
        'totalBytes', ranked.total_bytes,
        'tableBytes', ranked.table_bytes,
        'indexBytes', ranked.index_bytes,
        'totalPercent', ranked.total_percent
      ) order by ranked.total_bytes desc, ranked.table_name)
      from ranked
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'tableName', ranked.table_name,
        'rowEstimate', ranked.row_estimate,
        'totalBytes', ranked.total_bytes,
        'tableBytes', ranked.table_bytes,
        'indexBytes', ranked.index_bytes,
        'totalPercent', ranked.total_percent
      ) order by ranked.total_bytes desc, ranked.table_name)
      from (
        select *
        from ranked
        order by total_bytes desc, table_name
        limit 5
      ) ranked
    ), '[]'::jsonb)
  into
    current_total_bytes,
    current_table_bytes,
    current_index_bytes,
    table_rows,
    top_table_rows
  from totals;

  insert into public.admin_storage_snapshots (
    snapshot_date,
    total_bytes,
    table_bytes,
    index_bytes,
    top_tables
  ) values (
    current_date,
    current_total_bytes,
    current_table_bytes,
    current_index_bytes,
    top_table_rows
  )
  on conflict (snapshot_date) do update
  set
    total_bytes = excluded.total_bytes,
    table_bytes = excluded.table_bytes,
    index_bytes = excluded.index_bytes,
    top_tables = excluded.top_tables;

  select snapshot.total_bytes
  into previous_total_bytes
  from public.admin_storage_snapshots snapshot
  where snapshot.snapshot_date < current_date
  order by snapshot.snapshot_date desc
  limit 1;

  largest_table_bytes := coalesce((table_rows -> 0 ->> 'totalBytes')::bigint, 0);

  if previous_total_bytes is not null
    and previous_total_bytes > 0
    and current_total_bytes > previous_total_bytes * 1.25
  then
    warnings := warnings || jsonb_build_array('Database storage grew by more than 25% since the previous snapshot.');
  end if;

  if current_total_bytes > 0 and current_index_bytes::numeric / current_total_bytes::numeric > 0.6 then
    warnings := warnings || jsonb_build_array('Indexes account for more than 60% of tracked database storage.');
  end if;

  if current_total_bytes > 0 and largest_table_bytes::numeric / current_total_bytes::numeric > 0.5 then
    warnings := warnings || jsonb_build_array('One table accounts for more than half of tracked database storage.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'date', snapshot.snapshot_date,
    'totalBytes', snapshot.total_bytes,
    'tableBytes', snapshot.table_bytes,
    'indexBytes', snapshot.index_bytes,
    'topTables', snapshot.top_tables
  ) order by snapshot.snapshot_date), '[]'::jsonb)
  into trend_rows
  from public.admin_storage_snapshots snapshot
  where snapshot.snapshot_date >= current_date - (window_days - 1);

  perform public.record_admin_audit('storage_metrics_read', 'admin_storage_snapshots', null, jsonb_build_object('days', window_days));

  return jsonb_build_object(
    'totalBytes', current_total_bytes,
    'tableBytes', current_table_bytes,
    'indexBytes', current_index_bytes,
    'tables', table_rows,
    'trend', trend_rows,
    'warnings', warnings
  );
end;
$$;

grant select on public.admin_storage_snapshots to authenticated;
grant execute on function public.get_admin_storage_metrics_v1(integer) to authenticated;
