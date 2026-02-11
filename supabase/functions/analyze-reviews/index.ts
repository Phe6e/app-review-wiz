const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function analyzeBatch(batch: any[], apiKey: string): Promise<any[]> {
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
        { role: 'user', content: reviewTexts }
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

  let parsed;
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse AI response:', content);
    parsed = [];
  }

  return batch.map((review: any, index: number) => {
    const analysis = parsed.find((p: any) => p.index === index);
    return {
      ...review,
      sentiment: analysis?.sentiment || (review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral'),
      keywords: analysis?.keywords || [],
    };
  });
}

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

    // Process ALL reviews in batches of 20
    const BATCH_SIZE = 20;
    const allAnalyzed: any[] = [];

    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);
      const analyzed = await analyzeBatch(batch, apiKey);
      allAnalyzed.push(...analyzed);
    }

    // Extract all keywords with frequency
    const keywordMap: Record<string, { count: number; sentiment: string }> = {};
    allAnalyzed.forEach((r: any) => {
      (r.keywords || []).forEach((k: string) => {
        if (!keywordMap[k]) {
          keywordMap[k] = { count: 0, sentiment: r.sentiment || 'neutral' };
        }
        keywordMap[k].count++;
        // Keep the most common sentiment for this keyword
        if (r.sentiment === 'negative') keywordMap[k].sentiment = 'negative';
      });
    });

    const maxCount = Math.max(...Object.values(keywordMap).map(v => v.count), 1);
    const topKeywords = Object.entries(keywordMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30)
      .map(([text, data]) => ({
        text,
        weight: Math.round((data.count / maxCount) * 100),
        sentiment: data.sentiment,
      }));

    // Calculate sentiment distribution from ALL reviews
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    allAnalyzed.forEach((r: any) => {
      if (r.sentiment in sentimentCounts) {
        sentimentCounts[r.sentiment as keyof typeof sentimentCounts]++;
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        reviews: allAnalyzed,
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
