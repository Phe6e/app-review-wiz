import { useState, useMemo, useCallback } from 'react';
import { Loader2, Star, TrendingUp, Zap } from 'lucide-react';
import AppSearchBar from '@/components/AppSearchBar';
import SentimentChart from '@/components/SentimentChart';
import { Store, AppResult, ReviewResult, fetchReviews, analyzeReviews } from '@/lib/api';

interface CompetitorComparisonProps {
  store: Store;
  country: string;
  myApp: AppResult | null;
  myReviews: ReviewResult[];
}

interface AppAnalysis {
  app: AppResult;
  reviews: ReviewResult[];
  keywords: { text: string; weight: number; sentiment?: string }[];
  sentimentDist: { name: string; value: number; color: string }[];
  avgRating: number;
  loading: boolean;
}

const CompetitorComparison = ({ store, country, myApp, myReviews }: CompetitorComparisonProps) => {
  const [competitor, setCompetitor] = useState<AppAnalysis | null>(null);

  const myAnalysis = useMemo((): AppAnalysis | null => {
    if (!myApp) return null;
    const analyzed = myReviews.filter(r => r.sentiment);
    const pos = analyzed.filter(r => r.sentiment === 'positive').length;
    const neg = analyzed.filter(r => r.sentiment === 'negative').length;
    const neu = analyzed.filter(r => r.sentiment === 'neutral').length;

    const kwMap = new Map<string, { weight: number; sentiment: string }>();
    for (const r of analyzed) {
      if (!r.keywords) continue;
      for (const kw of r.keywords) {
        const e = kwMap.get(kw) || { weight: 0, sentiment: r.sentiment || 'neutral' };
        e.weight++;
        kwMap.set(kw, e);
      }
    }

    return {
      app: myApp,
      reviews: myReviews,
      keywords: Array.from(kwMap.entries())
        .map(([text, v]) => ({ text, weight: v.weight, sentiment: v.sentiment }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5),
      sentimentDist: [
        { name: '긍정', value: pos, color: '#007AFF' },
        { name: '부정', value: neg, color: '#FF3B30' },
        { name: '중립', value: neu, color: '#8E8E93' },
      ],
      avgRating: myReviews.length > 0
        ? Math.round((myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length) * 10) / 10
        : myApp.rating,
      loading: false,
    };
  }, [myApp, myReviews]);

  const handleSelectCompetitor = useCallback(async (app: AppResult) => {
    setCompetitor({
      app,
      reviews: [],
      keywords: [],
      sentimentDist: [
        { name: '긍정', value: 0, color: '#5856D6' },
        { name: '부정', value: 0, color: '#FF9500' },
        { name: '중립', value: 0, color: '#8E8E93' },
      ],
      avgRating: app.rating,
      loading: true,
    });

    try {
      const result = await fetchReviews(app.id, store, country, 1);
      if (result.success && result.reviews?.length > 0) {
        const reviews = result.reviews.slice(0, 100);
        const analysis = await analyzeReviews(reviews);

        const analyzed = analysis.success ? analysis.reviews : reviews;
        const pos = analyzed.filter((r: ReviewResult) => r.sentiment === 'positive').length;
        const neg = analyzed.filter((r: ReviewResult) => r.sentiment === 'negative').length;
        const neu = analyzed.filter((r: ReviewResult) => r.sentiment === 'neutral').length;

        const kwMap = new Map<string, { weight: number; sentiment: string }>();
        for (const r of analyzed) {
          if (!r.keywords) continue;
          for (const kw of r.keywords) {
            const e = kwMap.get(kw) || { weight: 0, sentiment: r.sentiment || 'neutral' };
            e.weight++;
            kwMap.set(kw, e);
          }
        }

        setCompetitor({
          app,
          reviews: analyzed,
          keywords: Array.from(kwMap.entries())
            .map(([text, v]) => ({ text, weight: v.weight, sentiment: v.sentiment }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 5),
          sentimentDist: [
            { name: '긍정', value: pos, color: '#5856D6' },
            { name: '부정', value: neg, color: '#FF9500' },
            { name: '중립', value: neu, color: '#8E8E93' },
          ],
          avgRating: analyzed.length > 0
            ? Math.round((analyzed.reduce((s: number, r: ReviewResult) => s + r.rating, 0) / analyzed.length) * 10) / 10
            : app.rating,
          loading: false,
        });
      } else {
        setCompetitor(prev => prev ? { ...prev, loading: false } : null);
      }
    } catch (e) {
      console.error('Competitor fetch error:', e);
      setCompetitor(prev => prev ? { ...prev, loading: false } : null);
    }
  }, [store, country]);

  const ratingDiff = competitor && !competitor.loading && myAnalysis
    ? Math.round((myAnalysis.avgRating - competitor.avgRating) * 10) / 10
    : null;

  // Generate insights
  const insights = useMemo(() => {
    if (!competitor || competitor.loading || !myAnalysis) return [];
    const items: string[] = [];

    if (ratingDiff !== null) {
      if (ratingDiff > 0) items.push(`우리 앱이 경쟁사보다 평점이 ${ratingDiff}점 높습니다.`);
      else if (ratingDiff < 0) items.push(`경쟁사가 우리 앱보다 평점이 ${Math.abs(ratingDiff)}점 높습니다.`);
      else items.push('두 앱의 평균 평점이 동일합니다.');
    }

    const myPos = myAnalysis.sentimentDist.find(d => d.name === '긍정')?.value || 0;
    const myTotal = myAnalysis.sentimentDist.reduce((s, d) => s + d.value, 0) || 1;
    const compPos = competitor.sentimentDist.find(d => d.name === '긍정')?.value || 0;
    const compTotal = competitor.sentimentDist.reduce((s, d) => s + d.value, 0) || 1;
    const myPosRate = Math.round((myPos / myTotal) * 100);
    const compPosRate = Math.round((compPos / compTotal) * 100);
    if (myPosRate > compPosRate) {
      items.push(`긍정 리뷰 비율이 경쟁사보다 ${myPosRate - compPosRate}%p 높습니다.`);
    } else if (compPosRate > myPosRate) {
      items.push(`경쟁사의 긍정 리뷰 비율이 ${compPosRate - myPosRate}%p 더 높습니다.`);
    }

    const myKws = new Set(myAnalysis.keywords.map(k => k.text));
    const compKws = new Set(competitor.keywords.map(k => k.text));
    const unique = myAnalysis.keywords.filter(k => !compKws.has(k.text));
    if (unique.length > 0) {
      items.push(`우리 앱만의 강점 키워드: ${unique.map(k => `'${k.text}'`).join(', ')}`);
    }
    const compUnique = competitor.keywords.filter(k => !myKws.has(k.text));
    if (compUnique.length > 0) {
      items.push(`경쟁사만의 강점 키워드: ${compUnique.map(k => `'${k.text}'`).join(', ')}`);
    }

    return items;
  }, [myAnalysis, competitor, ratingDiff]);

  if (!myApp || !myAnalysis) {
    return (
      <div className="glass-card p-16 text-center animate-fade-in">
        <p className="text-muted-foreground text-lg font-medium">먼저 '내 앱 분석' 탭에서 앱을 검색해주세요.</p>
        <p className="text-sm text-muted-foreground mt-2">검색 후 경쟁사 비교 기능을 이용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* VS Header */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* My App */}
        <div className="glass-card p-5 flex items-center gap-4">
          {myApp.icon && <img src={myApp.icon} alt={myApp.name} className="w-12 h-12 rounded-xl" />}
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{myApp.name}</p>
            <p className="text-sm text-muted-foreground">{myApp.developer}</p>
          </div>
          <div className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF' }}>
            우리 앱
          </div>
        </div>

        <div className="text-center font-bold text-lg text-muted-foreground hidden md:block">VS</div>

        {/* Competitor Search */}
        <div>
          {competitor ? (
            <div className="glass-card p-5 flex items-center gap-4">
              {competitor.app.icon && <img src={competitor.app.icon} alt={competitor.app.name} className="w-12 h-12 rounded-xl" />}
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{competitor.app.name}</p>
                <p className="text-sm text-muted-foreground">{competitor.app.developer}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(88, 86, 214, 0.1)', color: '#5856D6' }}>
                  경쟁사
                </div>
                <button onClick={() => setCompetitor(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">변경</button>
              </div>
            </div>
          ) : (
            <AppSearchBar store={store} country={country} onSelectApp={handleSelectCompetitor} />
          )}
        </div>
      </div>

      {competitor?.loading && (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
          <p className="text-muted-foreground">경쟁사 리뷰를 분석하고 있습니다...</p>
        </div>
      )}

      {competitor && !competitor.loading && (
        <>
          {/* Rating Comparison */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-base text-foreground mb-5 text-center flex items-center justify-center gap-2">
              <Star className="w-4 h-4" /> 별점 비교
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <RatingBar label={myApp.name} rating={myAnalysis.avgRating} color="#007AFF" />
              <RatingBar label={competitor.app.name} rating={competitor.avgRating} color="#5856D6" />
            </div>
          </div>

          {/* Sentiment Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SentimentChart data={myAnalysis.sentimentDist} />
            <div className="glass-card p-6 flex flex-col h-full">
              <h3 className="font-semibold text-base text-foreground mb-4 text-center">경쟁사 감성 분석</h3>
              <div className="flex-1">
                <SentimentChartInner data={competitor.sentimentDist} />
              </div>
            </div>
          </div>

          {/* Keyword Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KeywordList title="우리 앱 강점 키워드" keywords={myAnalysis.keywords} color="#007AFF" />
            <KeywordList title="경쟁사 강점 키워드" keywords={competitor.keywords} color="#5856D6" />
          </div>

          {/* Auto Insights */}
          {insights.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-base text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> 자동 인사이트
              </h3>
              <div className="space-y-3">
                {insights.map((text, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                    <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Sub-components

const RatingBar = ({ label, rating, color }: { label: string; rating: number; color: string }) => (
  <div className="text-center">
    <p className="text-sm text-muted-foreground truncate mb-2">{label}</p>
    <p className="text-3xl font-bold" style={{ color }}>{rating}</p>
    <div className="mt-2 h-3 bg-secondary rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${(rating / 5) * 100}%`, background: color, opacity: 0.8 }}
      />
    </div>
    <p className="text-xs text-muted-foreground mt-1">/ 5.0</p>
  </div>
);

const SentimentChartInner = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-muted-foreground text-center mt-8">데이터 없음</p>;
  return (
    <div className="flex flex-col gap-3 justify-center h-full">
      {data.map(d => (
        <div key={d.name} className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
          <span className="text-sm text-muted-foreground w-8">{d.name}</span>
          <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(d.value / total) * 100}%`, background: d.color, opacity: 0.8 }}
            />
          </div>
          <span className="text-sm font-semibold text-foreground w-10 text-right">
            {Math.round((d.value / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
};

const KeywordList = ({ title, keywords, color }: { title: string; keywords: { text: string; weight: number }[]; color: string }) => (
  <div className="glass-card p-6">
    <h3 className="font-semibold text-base text-foreground mb-4 text-center">{title}</h3>
    {keywords.length === 0 ? (
      <p className="text-sm text-muted-foreground text-center">데이터 없음</p>
    ) : (
      <div className="space-y-3">
        {keywords.map((kw, i) => (
          <div key={kw.text} className="flex items-center gap-3">
            <span className="text-xs font-bold w-5 text-center" style={{ color }}>
              {i + 1}
            </span>
            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center px-3"
                style={{
                  width: `${(kw.weight / (keywords[0]?.weight || 1)) * 100}%`,
                  background: color,
                  opacity: 0.75,
                  minWidth: '60px',
                }}
              >
                <span className="text-xs font-medium text-white truncate">{kw.text}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">{kw.weight}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default CompetitorComparison;
