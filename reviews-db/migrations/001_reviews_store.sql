-- Review storage for project ohwveqcepywunrmgrzvr (app-review-wiz).
-- Reviews are collected from Apple's RSS feed by the collect-reviews edge function
-- and served to the browser from here, so the UI keeps working while the feed is empty.

-- Apps that someone has searched for; the scheduler keeps collecting these.
create table if not exists public.tracked_apps (
  app_id            text        not null,
  country           text        not null,
  app_name          text,
  last_requested_at timestamptz not null default now(),
  last_attempt_at   timestamptz,
  last_success_at   timestamptz,
  created_at        timestamptz not null default now(),
  primary key (app_id, country)
);

create table if not exists public.app_reviews (
  app_id      text        not null,
  country     text        not null,
  review_id   text        not null,
  author      text,
  rating      smallint    not null check (rating between 1 and 5),
  title       text,
  content     text,
  review_date timestamptz,
  version     text,
  helpful     integer     not null default 0,
  fetched_at  timestamptz not null default now(),
  primary key (app_id, country, review_id)
);

create index if not exists app_reviews_recent_idx
  on public.app_reviews (app_id, country, review_date desc);

-- RLS: the browser (anon) may only read. Writes happen in the edge function
-- with the service role, which bypasses RLS.
alter table public.tracked_apps enable row level security;
alter table public.app_reviews  enable row level security;

drop policy if exists "Anyone can read tracked apps" on public.tracked_apps;
create policy "Anyone can read tracked apps"
  on public.tracked_apps for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can read reviews" on public.app_reviews;
create policy "Anyone can read reviews"
  on public.app_reviews for select
  to anon, authenticated
  using (true);
