const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, store, country = 'kr' } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let apps = [];

    if (store === 'apple') {
      // Apple iTunes Search API - publicly available
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=${country}&media=software&limit=10`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`iTunes API returned ${response.status}`);
      }

      const data = await response.json();

      apps = (data.results || []).map((app: any) => ({
        id: String(app.trackId),
        name: app.trackName,
        icon: app.artworkUrl60 || app.artworkUrl100,
        developer: app.artistName,
        rating: Math.round((app.averageUserRating || 0) * 10) / 10,
        reviewCount: app.userRatingCount || 0,
        store: 'apple' as const,
        bundleId: app.bundleId,
      }));

    } else {
      // Google Play doesn't have a public search API
      // We'll return empty with guidance
      return new Response(
        JSON.stringify({
          success: true,
          apps: [],
          message: 'Google Play 검색은 현재 지원되지 않습니다. Apple App Store를 이용해주세요.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, apps }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error searching apps:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to search apps' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
