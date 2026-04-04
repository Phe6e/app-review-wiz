const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function analyzeBatch(batch: any[], apiKey: string): Promise<any[]> {
  const reviewTexts = batch.map((r: any, i: number) => `[${i}] (${r.rating}点) ${r.title}: ${r.content}`).join('\n');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are a sentiment analysis engine for app reviews. For each review, determine:
1. sentiment: "positive", "negative", or "neutral"
2. keywords: array of 1-3 key topics mentioned in Japanese
3. aiSummary: a concise 2-4 word summary in Japanese in [state + subject] format (e.g. "不安定な決済", "遅い読込", "頻繁なクラッシュ", "使いやすいUI")

Return ONLY valid JSON array like:
[{"index": 0, "sentiment": "positive", "keywords": ["デザイン", "UI"], "aiSummary": "使いやすいUI"}, ...]

No explanation, just JSON.

Reviews:
${reviewTexts}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const aiData = await response.json();
  const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

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
      aiSummary: analysis?.aiSummary || '',
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

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to first 20 reviews to avoid timeout
    const limitedReviews = reviews.slice(0, 20);
    const allAnalyzed = await analyzeBatch(limitedReviews, apiKey);

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
