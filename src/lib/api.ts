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
}

export async function searchApps(query: string, store: Store, country = 'kr') {
  return callEdgeFunction('search-apps', { query, store, country });
}

export async function fetchReviews(appId: string, store: Store, country = 'kr') {
  return callEdgeFunction('fetch-reviews', { appId, store, country });
}

export async function analyzeReviews(reviews: ReviewResult[]) {
  return callEdgeFunction('analyze-reviews', { reviews });
}
