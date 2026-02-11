const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviews } = await req.json();

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'reviews array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch reviews for analysis (max 20 at a time)
    const batch = reviews.slice(0, 20);
    const reviewTexts = batch.map((r: any, i: number) => `[${i}] (${r.rating}★) ${r.title}: ${r.content}`).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis engine for app reviews. For each review, determine:
1. sentiment: "positive", "negative", or "neutral"
2. keywords: array of 1-3 key topics mentioned

Return ONLY valid JSON array like:
[{"index": 0, "sentiment": "positive", "keywords": ["디자인", "UI"]}, ...]

No explanation, just JSON.`
          },
          {
            role: 'user',
            content: reviewTexts,
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AI API error:', errorData);
      throw new Error(`AI API returned ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    // Parse AI response - handle markdown code blocks
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      parsed = [];
    }

    // Merge results back into reviews
    const analyzedReviews = batch.map((review: any, index: number) => {
      const analysis = parsed.find((p: any) => p.index === index);
      return {
        ...review,
        sentiment: analysis?.sentiment || (review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'),
        keywords: analysis?.keywords || [],
      };
    });

    // Extract all keywords with frequency
    const keywordMap: Record<string, number> = {};
    analyzedReviews.forEach((r: any) => {
      (r.keywords || []).forEach((k: string) => {
        keywordMap[k] = (keywordMap[k] || 0) + 1;
      });
    });
    const topKeywords = Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([text, count]) => ({ text, weight: count * 20 }));

    // Calculate sentiment distribution
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    analyzedReviews.forEach((r: any) => {
      if (r.sentiment in sentimentCounts) {
        sentimentCounts[r.sentiment as keyof typeof sentimentCounts]++;
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        reviews: analyzedReviews,
        keywords: topKeywords,
        sentimentDistribution: sentimentCounts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing reviews:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
