-- Phase 1: My Garage.
-- One row per vehicle a user has saved. Rows are private to the auth.uid()
-- that created them (anonymous sessions included), enforced by RLS.
--
-- Design notes for later phases (do not build yet):
--   * The job-guide cache will be keyed on the *vehicle*, not the user:
--     (make_raw, model_raw, year range, engine_cc, fuel, job_id). Keep make_raw
--     and the raw provider payloads so that key can be derived without
--     re-querying DVLA/DVSA.
--   * `sources` holds the raw API payloads for the saved vehicle, so the
--     MOT-history view (Phase 2) can be built without another API round trip.

create table if not exists public.garage_vehicles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  country       text not null default 'GB' check (country in ('GB', 'US', 'other')),
  registration  text,
  vin           text,
  make          text not null,
  make_raw      text not null,
  model         text,
  year          integer check (year is null or (year between 1900 and 2100)),
  engine_cc     integer check (engine_cc is null or engine_cc > 0),
  fuel          text not null default 'unknown'
                check (fuel in ('petrol', 'diesel', 'hybrid', 'plug_in_hybrid', 'electric', 'other', 'unknown')),
  transmission  text not null default 'unknown'
                check (transmission in ('manual', 'automatic', 'unknown')),
  colour        text,
  uk            jsonb,
  provenance    jsonb not null default '[]'::jsonb,
  sources       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.garage_vehicles is 'Vehicles a user has added to My Garage. Private per auth.uid().';
comment on column public.garage_vehicles.provenance is 'Which source supplied each field: [{field, source, raw, note}]';
comment on column public.garage_vehicles.sources is 'Raw provider payloads (dvlaVes, dvsaMot, nhtsaVpic) captured at save time.';

create index if not exists garage_vehicles_user_id_idx on public.garage_vehicles (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists garage_vehicles_set_updated_at on public.garage_vehicles;
create trigger garage_vehicles_set_updated_at
  before update on public.garage_vehicles
  for each row execute function public.set_updated_at();

alter table public.garage_vehicles enable row level security;

drop policy if exists "garage: owner can select" on public.garage_vehicles;
create policy "garage: owner can select"
  on public.garage_vehicles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "garage: owner can insert" on public.garage_vehicles;
create policy "garage: owner can insert"
  on public.garage_vehicles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "garage: owner can update" on public.garage_vehicles;
create policy "garage: owner can update"
  on public.garage_vehicles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "garage: owner can delete" on public.garage_vehicles;
create policy "garage: owner can delete"
  on public.garage_vehicles for delete
  to authenticated
  using (auth.uid() = user_id);
