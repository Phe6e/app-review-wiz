const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callEdgeFunction(fnName: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export type Store = 'google' | 'apple';

export interface AppResult {
  id: string;
  name: string;
  icon: string;
  developer: string;
  rating: number;
  reviewCount: number;
  store: Store;
  bundleId?: string;
}

export interface ReviewResult {
  id: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  keywords?: string[];
  helpful?: number;
  version?: string;
  aiSummary?: string;
  isChurnWarning?: boolean;
}

export async function searchApps(query: string, store: Store, country = 'kr') {
  return callEdgeFunction('search-apps', { query, store, country });
}

export type Country = string;

export interface FetchReviewsResult {
  success: boolean;
  reviews: ReviewResult[];
  hasNextPage: boolean;
  /** When reviews for this app were last pulled from Apple successfully (ISO string) */
  lastCollectedAt?: string | null;
  error?: string;
  message?: string;
}

// Review store (separate Supabase project). The anon key is public and read-only via RLS.
const REVIEWS_URL = import.meta.env.VITE_REVIEWS_SUPABASE_URL || 'https://ohwveqcepywunrmgrzvr.supabase.co';
const REVIEWS_ANON_KEY = import.meta.env.VITE_REVIEWS_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9od3ZlcWNlcHl3dW5ybWdyenZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTk1MzEsImV4cCI6MjA5MDg3NTUzMX0.j3dWKlAtAVGK_2VGMX_YSL9KLVqA4IuVhHgoWglJecE';
const REVIEWS_HEADERS = {
  apikey: REVIEWS_ANON_KEY,
  Authorization: `Bearer ${REVIEWS_ANON_KEY}`,
};

const PAGE_SIZE = 50;

interface ReviewRow {
  review_id: string;
  author: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  review_date: string | null;
  version: string | null;
  helpful: number;
}

async function readStoredReviews(appId: string, country: string, page: number) {
  const params = new URLSearchParams({
    select: 'review_id,author,rating,title,content,review_date,version,helpful',
    app_id: `eq.${appId}`,
    country: `eq.${country}`,
    order: 'review_date.desc.nullslast,review_id.desc',
    offset: String((page - 1) * PAGE_SIZE),
    limit: String(PAGE_SIZE + 1), // one extra row tells us whether another page exists
  });
  const res = await fetch(`${REVIEWS_URL}/rest/v1/app_reviews?${params}`, { headers: REVIEWS_HEADERS });
  if (!res.ok) throw new Error(`Review store returned ${res.status}`);
  const rows: ReviewRow[] = await res.json();
  const reviews: ReviewResult[] = rows.slice(0, PAGE_SIZE).map(r => ({
    id: r.review_id,
    author: r.author ?? '익명',
    rating: r.rating,
    title: r.title ?? '',
    content: r.content ?? '',
    date: r.review_date ?? '',
    version: r.version ?? '',
    helpful: r.helpful ?? 0,
  }));
  return { reviews, hasNextPage: rows.length > PAGE_SIZE };
}

async function readLastCollectedAt(appId: string, country: string): Promise<string | null> {
  const params = new URLSearchParams({
    select: 'last_success_at',
    app_id: `eq.${appId}`,
    country: `eq.${country}`,
  });
  const res = await fetch(`${REVIEWS_URL}/rest/v1/tracked_apps?${params}`, { headers: REVIEWS_HEADERS });
  if (!res.ok) return null;
  const rows: { last_success_at: string | null }[] = await res.json();
  return rows[0]?.last_success_at ?? null;
}

/** Registers the app for scheduled collection and pulls the latest reviews from Apple now. */
async function requestCollection(appId: string, country: string, appName?: string) {
  const res = await fetch(`${REVIEWS_URL}/functions/v1/collect-reviews`, {
    method: 'POST',
    headers: { ...REVIEWS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, country, appName }),
  });
  return res.json();
}

export async function fetchReviews(
  appId: string,
  store: Store,
  country = 'kr',
  page = 1,
  appName?: string,
): Promise<FetchReviewsResult> {
  if (store !== 'apple') {
    return {
      success: true,
      reviews: [],
      hasNextPage: false,
      message: 'Google Play 리뷰는 현재 공개 API가 없습니다. Apple App Store 리뷰를 이용해주세요.',
    };
  }

  const pageNum = Math.max(1, page);

  try {
    let stored = await readStoredReviews(appId, country, pageNum);

    if (pageNum === 1) {
      if (stored.reviews.length > 0) {
        // Show what we have right away; refresh from Apple in the background.
        requestCollection(appId, country, appName).catch(e => console.error('Collect error:', e));
      } else {
        // Nothing stored yet: wait for a first collection, then read again.
        await requestCollection(appId, country, appName).catch(e => console.error('Collect error:', e));
        stored = await readStoredReviews(appId, country, pageNum);
      }
    }

    return {
      success: true,
      ...stored,
      lastCollectedAt: pageNum === 1 ? await readLastCollectedAt(appId, country) : undefined,
    };
  } catch (e) {
    console.error('Fetch reviews error:', e);
    return {
      success: false,
      reviews: [],
      hasNextPage: false,
      error: e instanceof Error ? e.message : 'Failed to fetch reviews',
    };
  }
}

export async function analyzeReviews(reviews: ReviewResult[]) {
  return callEdgeFunction('analyze-reviews', { reviews, language: 'ko' });
}
