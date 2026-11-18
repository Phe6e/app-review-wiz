// collect-reviews: pulls Apple App Store reviews from the public RSS feed and stores them.
//
// POST { appId, country, appName? }  -> register the app for scheduled collection and collect it now
// POST { mode: "all" } + x-cron-secret -> collect every app requested in the last 7 days (scheduler)
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const MAX_PAGE = 10;
const PAGE_SIZE = 50;
const RETRY_DELAYS_MS = [1000, 2000, 3000];
const MIN_ATTEMPT_INTERVAL_MS = 60_000; // on-demand calls for the same app at most once a minute
const TRACK_DAYS = 7;
const RUN_BUDGET_MS = 120_000; // stay under the edge function wall-clock limit

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// deno-lint-ignore no-explicit-any
type Entry = Record<string, any>;

async function fetchPage(appId: string, country: string, page: number): Promise<Entry[]> {
  const base = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    const res = await fetch(`${base}?t=${Date.now()}`);
    if (!res.ok) continue;
    const data = await res.json().catch(() => null);
    const entry = data?.feed?.entry;
    if (!entry) continue;
    const entries = Array.isArray(entry) ? entry : [entry];
    if (entries.length > 0) return entries;
  }
  return [];
}

function toRow(e: Entry, appId: string, country: string) {
  return {
    app_id: appId,
    country,
    review_id: String(e.id?.label),
    author: e.author?.name?.label ?? null,
    rating: Number(e['im:rating'].label),
    title: e.title?.label ?? null,
    content: e.content?.label ?? null,
    review_date: e.updated?.label ?? null,
    version: e['im:version']?.label ?? null,
    helpful: Number(e['im:voteCount']?.label ?? 0) || 0,
  };
}

/** Collects pages until the feed runs out or a page brings nothing new. */
async function collectApp(appId: string, country: string) {
  const startedAt = new Date().toISOString();
  let inserted = 0;
  let received = 0;

  for (let page = 1; page <= MAX_PAGE; page++) {
    const entries = await fetchPage(appId, country, page);
    const rows = entries.filter(e => e['im:rating'] && e.id?.label).map(e => toRow(e, appId, country));
    received += rows.length;
    if (rows.length === 0) break;

    const { data, error } = await supabase
      .from('app_reviews')
      .upsert(rows, { onConflict: 'app_id,country,review_id', ignoreDuplicates: true })
      .select('review_id');
    if (error) throw error;

    const newCount = data?.length ?? 0;
    inserted += newCount;
    // Everything on this page was already stored, so older pages are too.
    if (newCount === 0 || rows.length < PAGE_SIZE) break;
  }

  const update: Record<string, string> = { last_attempt_at: startedAt };
  if (received > 0) update.last_success_at = new Date().toISOString();
  await supabase.from('tracked_apps').update(update).eq('app_id', appId).eq('country', country);

  return { received, inserted };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    // Scheduled run over every recently requested app
    if (body.mode === 'all') {
      if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
        return json({ success: false, error: 'unauthorized' }, 401);
      }
      const since = new Date(Date.now() - TRACK_DAYS * 86_400_000).toISOString();
      const { data: apps, error } = await supabase
        .from('tracked_apps')
        .select('app_id, country')
        .gte('last_requested_at', since)
        .order('last_attempt_at', { ascending: true, nullsFirst: true });
      if (error) throw error;

      const deadline = Date.now() + RUN_BUDGET_MS;
      const results = [];
      for (const app of apps ?? []) {
        if (Date.now() > deadline) break;
        try {
          results.push({ ...app, ...(await collectApp(app.app_id, app.country)) });
        } catch (e) {
          results.push({ ...app, error: String(e) });
        }
      }
      return json({ success: true, processed: results.length, total: apps?.length ?? 0, results });
    }

    // On-demand: register the app and collect it now
    const appId = String(body.appId ?? '').trim();
    const country = String(body.country ?? 'kr').trim().toLowerCase();
    if (!/^\d+$/.test(appId) || !/^[a-z]{2}$/.test(country)) {
      return json({ success: false, error: 'valid appId and country are required' }, 400);
    }

    const { data: existing } = await supabase
      .from('tracked_apps')
      .select('last_attempt_at')
      .eq('app_id', appId)
      .eq('country', country)
      .maybeSingle();

    await supabase.from('tracked_apps').upsert({
      app_id: appId,
      country,
      last_requested_at: new Date().toISOString(),
      ...(body.appName ? { app_name: String(body.appName).slice(0, 200) } : {}),
    }, { onConflict: 'app_id,country' });

    const lastAttempt = existing?.last_attempt_at ? new Date(existing.last_attempt_at).getTime() : 0;
    if (Date.now() - lastAttempt < MIN_ATTEMPT_INTERVAL_MS) {
      return json({ success: true, skipped: true });
    }

    const result = await collectApp(appId, country);
    return json({ success: true, ...result });
  } catch (e) {
    console.error('collect-reviews error:', e);
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
