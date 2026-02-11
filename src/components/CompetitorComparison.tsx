import { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, Star, TrendingUp, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import AppSearchBar from '@/components/AppSearchBar';
import { Store, AppResult, ReviewResult, fetchReviews, analyzeReviews } from '@/lib/api';

interface CompetitorComparisonProps {
  store: Store;
  country: string;
  myApp: AppResult | null;
  myReviews: ReviewResult[];
}

// Fetch up to 300 reviews by calling multiple pages
async function fetchBulkReviews(appId: string, store: Store, country: string, maxReviews = 300): Promise<ReviewResult[]> {
  const allReviews: ReviewResult[] = [];
  let page = 1;
  const maxPages = Math.ceil(maxReviews / 50);

  while (page <= maxPages) {
    const result = await fetchReviews(appId, store, country, page);
    if (!result.success || !result.reviews?.length) break;
    allReviews.push(...result.reviews);
    if (allReviews.length >= maxReviews || !result.hasNextPage) break;
    page++;
  }

  return allReviews.slice(0, maxReviews);
}

function buildAnalysis(reviews: ReviewResult[]) {
  const analyzed = reviews.filter(r => r.sentiment);
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
    keywords: Array.from(kwMap.entries())
      .map(([text, v]) => ({ text, weight: v.weight, sentiment: v.sentiment }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5),
    sentimentDist: [
      { name: '긍정', value: pos, color: '#007AFF' },
      { name: '부정', value: neg, color: '#FF3B30' },
      { name: '중립', value: neu, color: '#8E8E93' },
    ],
    ratingDist: [5, 4, 3, 2, 1].map(r => ({
      rating: r,
      count: reviews.filter(rev => rev.rating === r).length,
    })),
    avgRating: reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0,
  };
}

/* ─── Sentiment Trend helpers ─── */
function buildMonthlyTrend(reviews: ReviewResult[]) {
  const buckets = new Map<string, { positive: number; total: number; ts: number }>();
  for (const r of reviews) {
    if (!r.date || !r.sentiment) continue;
    const d = new Date(r.date);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = buckets.get(key) || { positive: 0, total: 0, ts: d.getTime() };
    entry.total++;
    if (r.sentiment === 'positive') entry.positive++;
    if (d.getTime() < entry.ts) entry.ts = d.getTime(); // keep earliest for sorting
    buckets.set(key, entry);
  }
  return Array.from(buckets.entries())
    .sort(([, a], [, b]) => a.ts - b.ts)
    .map(([key, v]) => ({
      month: key.slice(2), // "25-01"
      rate: v.total > 0 ? Math.round((v.positive / v.total) * 100) : 0,
    }));
}

const CompetitorComparison = ({ store, country, myApp, myReviews }: CompetitorComparisonProps) => {
  const [competitorApp, setCompetitorApp] = useState<AppResult | null>(null);
  const [competitorReviews, setCompetitorReviews] = useState<ReviewResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [myBulkReviews, setMyBulkReviews] = useState<ReviewResult[]>([]);
  const [myBulkLoading, setMyBulkLoading] = useState(false);

  const handleSelectCompetitor = useCallback(async (app: AppResult) => {
    setCompetitorApp(app);
    setCompetitorReviews([]);
    setLoading(true);
    setProgress('경쟁사 리뷰 수집 중...');
    try {
      const reviews = await fetchBulkReviews(app.id, store, country, 300);
      setProgress(`${reviews.length}개 리뷰 감성 분석 중...`);
      if (reviews.length > 0) {
        const analysis = await analyzeReviews(reviews);
        setCompetitorReviews(analysis.success ? analysis.reviews : reviews);
      }
    } catch (e) {
      console.error('Competitor fetch error:', e);
    } finally {
      setLoading(false);
      setProgress('');
    }
  }, [store, country]);

  useEffect(() => {
    if (!myApp) return;
    if (myReviews.length >= 100) { setMyBulkReviews([]); return; }
    let cancelled = false;
    const fetchBulk = async () => {
      setMyBulkLoading(true);
      try {
        const reviews = await fetchBulkReviews(myApp.id, store, country, 300);
        if (!cancelled && reviews.length > 0) {
          const analysis = await analyzeReviews(reviews);
          if (!cancelled) setMyBulkReviews(analysis.success ? analysis.reviews : reviews);
        }
      } catch (e) { console.error('Bulk fetch error:', e); }
      finally { if (!cancelled) setMyBulkLoading(false); }
    };
    fetchBulk();
    return () => { cancelled = true; };
  }, [myApp?.id, store, country]);

  const effectiveMyReviews = myBulkReviews.length > 0 ? myBulkReviews : myReviews;

  const effectiveMyAnalysis = useMemo(() => {
    if (!myApp) return null;
    if (effectiveMyReviews.length === 0) return null;
    const analysis = buildAnalysis(effectiveMyReviews);
    analysis.sentimentDist = [
      { name: '긍정', value: analysis.sentimentDist[0].value, color: '#007AFF' },
      { name: '부정', value: analysis.sentimentDist[1].value, color: '#FF3B30' },
      { name: '중립', value: analysis.sentimentDist[2].value, color: '#8E8E93' },
    ];
    return { ...analysis, avgRating: analysis.avgRating || myApp.rating };
  }, [myApp, effectiveMyReviews]);

  const compAnalysis = useMemo(() => {
    if (!competitorApp || competitorReviews.length === 0) return null;
    const analysis = buildAnalysis(competitorReviews);
    analysis.sentimentDist = [
      { name: '긍정', value: analysis.sentimentDist[0].value, color: '#5856D6' },
      { name: '부정', value: analysis.sentimentDist[1].value, color: '#FF9500' },
      { name: '중립', value: analysis.sentimentDist[2].value, color: '#8E8E93' },
    ];
    return { ...analysis, avgRating: analysis.avgRating || competitorApp.rating };
  }, [competitorApp, competitorReviews]);

  /* ─── Trend data ─── */
  const trendData = useMemo(() => {
    if (!effectiveMyAnalysis || !compAnalysis) return [];
    const myTrend = buildMonthlyTrend(effectiveMyReviews);
    const compTrend = buildMonthlyTrend(competitorReviews);
    const allMonths = new Set([...myTrend.map(t => t.month), ...compTrend.map(t => t.month)]);
    const myMap = new Map(myTrend.map(t => [t.month, t.rate]));
    const compMap = new Map(compTrend.map(t => [t.month, t.rate]));
    return Array.from(allMonths)
      .sort() // lexicographic "YY-MM" works for chronological order
      .map(month => ({
        month,
        myRate: myMap.get(month) ?? null,
        compRate: compMap.get(month) ?? null,
      }));
  }, [effectiveMyReviews, competitorReviews, effectiveMyAnalysis, compAnalysis]);

  const ratingDiff = compAnalysis && effectiveMyAnalysis
    ? Math.round((effectiveMyAnalysis.avgRating - compAnalysis.avgRating) * 10) / 10
    : null;

  /* ─── Insights ─── */
  const insights = useMemo(() => {
    if (!compAnalysis || !effectiveMyAnalysis) return [];
    const items: string[] = [];

    if (ratingDiff !== null) {
      if (ratingDiff > 0) items.push(`우리 앱이 경쟁사보다 평점이 ${ratingDiff}점 높습니다.`);
      else if (ratingDiff < 0) items.push(`경쟁사가 우리 앱보다 평점이 ${Math.abs(ratingDiff)}점 높습니다.`);
      else items.push('두 앱의 평균 평점이 동일합니다.');
    }

    const myPos = effectiveMyAnalysis.sentimentDist.find(d => d.name === '긍정')?.value || 0;
    const myTotal = effectiveMyAnalysis.sentimentDist.reduce((s, d) => s + d.value, 0) || 1;
    const compPos = compAnalysis.sentimentDist.find(d => d.name === '긍정')?.value || 0;
    const compTotal = compAnalysis.sentimentDist.reduce((s, d) => s + d.value, 0) || 1;
    const myPosRate = Math.round((myPos / myTotal) * 100);
    const compPosRate = Math.round((compPos / compTotal) * 100);
    if (myPosRate > compPosRate) {
      items.push(`긍정 리뷰 비율이 경쟁사보다 ${myPosRate - compPosRate}%p 높습니다.`);
    } else if (compPosRate > myPosRate) {
      items.push(`경쟁사의 긍정 리뷰 비율이 ${compPosRate - myPosRate}%p 더 높습니다.`);
    }

    const myKws = new Set(effectiveMyAnalysis.keywords.map(k => k.text));
    const compKws = new Set(compAnalysis.keywords.map(k => k.text));
    const unique = effectiveMyAnalysis.keywords.filter(k => !compKws.has(k.text));
    if (unique.length > 0) {
      items.push(`우리 앱은 '${unique[0].text}' 키워드에서 우세합니다. (언급 ${unique[0].weight}회)`);
    }
    const compUnique = compAnalysis.keywords.filter(k => !myKws.has(k.text));
    if (compUnique.length > 0) {
      items.push(`경쟁사는 '${compUnique[0].text}' 키워드에서 상승세입니다. (언급 ${compUnique[0].weight}회)`);
    }

    // Review count insight
    items.push(`분석 기반: 우리 앱 ${effectiveMyReviews.length}개, 경쟁사 ${competitorReviews.length}개 리뷰`);

    return items;
  }, [effectiveMyAnalysis, compAnalysis, ratingDiff, effectiveMyReviews.length, competitorReviews.length]);

  if (!myApp) {
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
        <div>
          {competitorApp ? (
            <div className="glass-card p-5 flex items-center gap-4">
              {competitorApp.icon && <img src={competitorApp.icon} alt={competitorApp.name} className="w-12 h-12 rounded-xl" />}
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{competitorApp.name}</p>
                <p className="text-sm text-muted-foreground">{competitorApp.developer}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(88, 86, 214, 0.1)', color: '#5856D6' }}>
                  경쟁사
                </div>
                <button onClick={() => { setCompetitorApp(null); setCompetitorReviews([]); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">변경</button>
              </div>
            </div>
          ) : (
            <AppSearchBar store={store} country={country} onSelectApp={handleSelectCompetitor} />
          )}
        </div>
      </div>

      {/* Loading */}
      {(loading || myBulkLoading) && (
        <div className="glass-card p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-3" />
          <p className="text-foreground font-medium">
            {loading ? '경쟁사 데이터를 정밀 분석 중입니다...' : '우리 앱 데이터를 확장 수집 중입니다...'}
          </p>
          {progress && <p className="text-sm text-muted-foreground mt-1">{progress}</p>}
        </div>
      )}

      {compAnalysis && effectiveMyAnalysis && !loading && (
        <>
          {/* 1. Minimal Rating Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MinimalRatingCard label="우리 앱 별점" avgRating={effectiveMyAnalysis.avgRating} color="#007AFF" />
            <MinimalRatingCard label="경쟁 앱 별점" avgRating={compAnalysis.avgRating} color="#5856D6" />
          </div>

          {/* 2. Sentiment Donut Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DonutCard title="우리 앱 감성 분석" data={effectiveMyAnalysis.sentimentDist} />
            <DonutCard title="경쟁사 감성 분석" data={compAnalysis.sentimentDist} />
          </div>

          {/* 3. Sentiment Trend Comparison (full width) */}
          {trendData.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-base text-foreground mb-4 text-center">감성 추이 비교</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="myLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34C759" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#34C759" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="compLineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5856D6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#5856D6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,90%)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(240,4%,56%)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(240,4%,56%)" fontSize={11} tickLine={false} axisLine={false} width={32} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    }}
                    formatter={(v: number, name: string) => [`${v}%`, name === 'myRate' ? '우리 앱' : '경쟁사']}
                  />
                  <Legend formatter={(v) => v === 'myRate' ? '우리 앱' : '경쟁사'} />
                  <Line type="monotone" dataKey="myRate" stroke="#34C759" strokeWidth={2.5} dot={{ r: 3, fill: '#34C759' }} connectNulls />
                  <Line type="monotone" dataKey="compRate" stroke="#5856D6" strokeWidth={2.5} dot={{ r: 3, fill: '#5856D6' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 4. Keyword Bubbles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KeywordBubbles title="우리 앱 주요 키워드" keywords={effectiveMyAnalysis.keywords} hue="green" />
            <KeywordBubbles title="경쟁사 주요 키워드" keywords={compAnalysis.keywords} hue="purple" />
          </div>

          {/* 5. Auto Insights */}
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

/* ═══════════════ Sub-components ═══════════════ */

const MinimalRatingCard = ({ label, avgRating, color }: { label: string; avgRating: number; color: string }) => {
  const pct = Math.min((avgRating / 5) * 100, 100);
  return (
    <div className="glass-card p-6 text-center">
      <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1.5">
        <Star className="w-3.5 h-3.5" /> {label}
      </h3>
      <p className="text-5xl font-bold mb-4" style={{ color }}>{avgRating}</p>
      <div className="h-2 bg-secondary rounded-full overflow-hidden mx-auto max-w-[200px]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, opacity: 0.8 }}
        />
      </div>
    </div>
  );
};

const DonutCard = ({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="glass-card p-6 flex flex-col h-full">
        <h3 className="font-semibold text-base text-foreground mb-4 text-center">{title}</h3>
        <div className="flex-1 flex items-center justify-center"><p className="text-sm text-muted-foreground">데이터 없음</p></div>
      </div>
    );
  }
  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-semibold text-base text-foreground mb-4 text-center">{title}</h3>
      <div className="flex-1 flex flex-row items-center justify-center gap-6">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={58} dataKey="value" strokeWidth={0}>
                {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-3">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-muted-foreground w-8">{d.name}</span>
              <span className="text-sm font-semibold text-foreground">{Math.round((d.value / total) * 100)}%</span>
              <span className="text-xs text-muted-foreground">({d.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const KeywordBubbles = ({ title, keywords, hue }: { title: string; keywords: { text: string; weight: number }[]; hue: 'green' | 'purple' }) => {
  const maxW = keywords[0]?.weight || 1;
  const bg = hue === 'green'
    ? (ratio: number) => `rgba(52, 199, 89, ${0.1 + ratio * 0.2})`
    : (ratio: number) => `rgba(88, 86, 214, ${0.1 + ratio * 0.2})`;
  const border = hue === 'green'
    ? 'rgba(52, 199, 89, 0.3)'
    : 'rgba(88, 86, 214, 0.3)';
  const textColor = hue === 'green' ? '#2D9A4E' : '#4B49B6';

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-base text-foreground mb-5 text-center">{title}</h3>
      {keywords.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center">데이터 없음</p>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {keywords.map(kw => {
            const ratio = kw.weight / maxW;
            const size = 0.8 + ratio * 0.5; // scale 0.8 ~ 1.3
            return (
              <div
                key={kw.text}
                className="inline-flex items-center gap-2 rounded-full transition-all duration-300 hover:scale-110 cursor-default"
                style={{
                  padding: `${6 + ratio * 6}px ${14 + ratio * 10}px`,
                  background: bg(ratio),
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: `1px solid ${border}`,
                  fontSize: `${size}rem`,
                  boxShadow: `0 4px 16px ${hue === 'green' ? 'rgba(52,199,89,0.08)' : 'rgba(88,86,214,0.08)'}`,
                }}
              >
                <span className="font-semibold" style={{ color: textColor }}>{kw.text}</span>
                <span className="text-xs font-medium opacity-60" style={{ color: textColor }}>{kw.weight}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompetitorComparison;
