-- Phase 3: job guide cache. Not yet used at runtime (Phase 3 serves committed
-- JSON files); this is the schema the file store will move into.
--
-- Cached on the *vehicle*, never the user. One row per generated guide version.
-- Rows are corrected by inserting a new version, never by editing history.

create table if not exists public.job_guides (
  id            text primary key,                     -- job__make__model__yearfrom-yearto__cc__fuel
  job_id        text not null,
  make_raw      text not null,
  model_raw     text not null,
  year_from     integer not null,
  year_to       integer not null,
  engine_cc     integer,
  fuel          text not null,
  version       integer not null default 1,
  status        text not null check (status in ('draft', 'blocked', 'reviewed')),
  content       jsonb not null,                       -- GuideContentSchema
  scope         jsonb not null,                       -- GuideScopeSchema (variant notes etc.)
  spec_check    jsonb not null,                       -- {ok, violations[]}
  generated_by  jsonb not null,                       -- {provider, model, tokens, duration}
  grounding     jsonb not null,                       -- facts given to the model
  generated_at  timestamptz not null,
  reviewed_at   timestamptz,
  reviewed_by   text,
  created_at    timestamptz not null default now()
);

create index if not exists job_guides_lookup_idx
  on public.job_guides (job_id, make_raw, model_raw, fuel, status);

alter table public.job_guides enable row level security;

-- Reviewed guides are public content; drafts are not.
drop policy if exists "guides: anyone can read reviewed" on public.job_guides;
create policy "guides: anyone can read reviewed"
  on public.job_guides for select
  to anon, authenticated
  using (status = 'reviewed');

-- Writes happen from the generator with the service role, never from the browser.
