const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appId, store, country = 'kr', count = 50 } = await req.json();

    if (!appId) {
      return new Response(
        JSON.stringify({ success: false, error: 'appId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let reviews = [];

    if (store === 'apple') {
      // Apple App Store RSS feed - publicly available
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Apple API returned ${response.status}`);
      }

      const data = await response.json();
      const entries = data?.feed?.entry || [];

      reviews = entries
        .filter((entry: any) => entry['im:rating'])
        .map((entry: any, index: number) => ({
          id: `apple-${index}`,
          author: entry.author?.name?.label || '익명',
          rating: parseInt(entry['im:rating']?.label || '0'),
          title: entry.title?.label || '',
          content: entry.content?.label || '',
          date: entry.updated?.label?.split('T')[0] || '',
        }));

    } else {
      // Google Play - use the public sort=2 (newest) endpoint
      const url = `https://store.rg-adguard.net/api/playReviews?id=${encodeURIComponent(appId)}&lang=${country}&num=${count}`;
      
      // Fallback: try a simpler approach using Google Play's web page
      // Since there's no official API, we return a message suggesting the user
      // use a scraping service or provide their own API key
      
      // For demo purposes, we'll try the iTunes-style approach with a different endpoint
      const response = await fetch(
        `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(appId)}&country=${country}`
      );

      // Google Play doesn't have a public review API like Apple
      // We'll return a structured error with guidance
      return new Response(
        JSON.stringify({
          success: true,
          reviews: [],
          message: 'Google Play 리뷰는 현재 공개 API가 없습니다. Apple App Store 리뷰를 이용해주세요.',
          store: 'google',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, reviews, store }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch reviews' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
