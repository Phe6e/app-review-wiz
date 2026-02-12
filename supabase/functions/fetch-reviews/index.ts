const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appId, store, country = 'kr', page = 1 } = await req.json();

    if (!appId) {
      return new Response(
        JSON.stringify({ success: false, error: 'appId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let reviews: any[] = [];
    let hasNextPage = false;

    if (store === 'apple') {
      // Apple App Store RSS feed supports page parameter (1-10)
      const pageNum = Math.max(1, Math.min(page, 10));
      const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${pageNum}/id=${appId}/sortBy=mostRecent/json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Apple API returned ${response.status}`);
      }

      const data = await response.json();
      const entries = data?.feed?.entry || [];

      reviews = entries
        .filter((entry: any) => entry['im:rating'])
        .map((entry: any, index: number) => ({
          id: `apple-p${pageNum}-${index}`,
          author: entry.author?.name?.label || '익명',
          rating: parseInt(entry['im:rating']?.label || '0'),
          title: entry.title?.label || '',
          content: entry.content?.label || '',
          date: entry.updated?.label?.split('T')[0] || '',
          version: entry['im:version']?.label || '',
        }));

      // Apple RSS supports up to 10 pages; if we got results, there might be more
      hasNextPage = reviews.length > 0 && pageNum < 10;

    } else {
      return new Response(
        JSON.stringify({
          success: true,
          reviews: [],
          hasNextPage: false,
          page: 1,
          message: 'Google Play 리뷰는 현재 공개 API가 없습니다. Apple App Store 리뷰를 이용해주세요.',
          store: 'google',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, reviews, store, page, hasNextPage }),
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
