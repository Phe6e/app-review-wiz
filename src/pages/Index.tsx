import { useState, useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { Star, MessageSquare, TrendingUp, BarChart3, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import StoreSelector from '@/components/StoreSelector';
import AppSearchBar from '@/components/AppSearchBar';
import ReviewCard from '@/components/ReviewCard';
import ReviewFilters from '@/components/ReviewFilters';
import SentimentChart from '@/components/SentimentChart';
import RatingDistribution from '@/components/RatingDistribution';
import SentimentTrend from '@/components/SentimentTrend';
import KeywordBarChart from '@/components/KeywordBarChart';
import DateRangePicker from '@/components/DateRangePicker';
import CountrySelector from '@/components/CountrySelector';
import StatCard from '@/components/StatCard';
import SegmentedControl from '@/components/SegmentedControl';
import CompetitorComparison from '@/components/CompetitorComparison';
import ChurnWarningWidget from '@/components/ChurnWarningWidget';
import VersionComparisonBar from '@/components/VersionComparisonBar';
import { Store, AppResult, ReviewResult, fetchReviews, analyzeReviews } from '@/lib/api';
import { Sentiment } from '@/data/mockData';
import { getStoreColors } from '@/lib/storeColors';
import { detectChurnWarnings, ChurnWarningUser } from '@/lib/churnDetection';

const EMPTY_RATING_DIST = [5, 4, 3, 2, 1].map(rating => ({ rating, count: 0 }));
const EMPTY_SENTIMENT_DIST = [
  { name: '긍정', value: 0, color: '' },
  { name: '부정', value: 0, color: '' },
  { name: '중립', value: 0, color: '' },
];
const EMPTY_VALUE = '–';

const Index = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [store, setStore] = useState<Store>('apple');
  const [country, setCountry] = useState('kr');
  const [selectedApp, setSelectedApp] = useState<AppResult | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null);
  const [reviews, setReviews] = useState<ReviewResult[]>([]);
  const [keywords, setKeywords] = useState<{ text: string; weight: number }[]>([]);
  const [sentimentDist, setSentimentDist] = useState(EMPTY_SENTIMENT_DIST);
  const [ratingDist, setRatingDist] = useState(EMPTY_RATING_DIST);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [lastCollectedAt, setLastCollectedAt] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<Date | undefined>(() => new Date());
  const [backgroundVersionReviews, setBackgroundVersionReviews] = useState<ReviewResult[]>([]);

  // Date-filtered reviews
  const dateFilteredReviews = useMemo(() => {
    if (!dateStart && !dateEnd) return reviews;
    return reviews.filter(r => {
      const d = new Date(r.date);
      if (dateStart && d < dateStart) return false;
      if (dateEnd) {
        const endOfDay = new Date(dateEnd);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    });
  }, [reviews, dateStart, dateEnd]);

  const analyzeAndUpdate = useCallback(async (allReviews: ReviewResult[]) => {
    setAnalyzing(true);
    try {
      const analysis = await analyzeReviews(allReviews);
      if (analysis.success) {
        setReviews(analysis.reviews);
        if (analysis.keywords?.length > 0) {
          setKeywords(analysis.keywords);
        }
        if (analysis.sentimentDistribution) {
          const sd = analysis.sentimentDistribution;
          const c = getStoreColors(store);
          setSentimentDist([
            { name: '긍정', value: sd.positive || 0, color: c.positive },
            { name: '부정', value: sd.negative || 0, color: c.negative },
            { name: '중립', value: sd.neutral || 0, color: c.neutral },
          ]);
        }
      }
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleSelectApp = useCallback(async (app: AppResult) => {
    setSelectedApp(app);
    setLoading(true);
    setFetchFailed(false);
    setEmptyMessage(null);
    setLastCollectedAt(null);
    setCurrentPage(1);
    setHasNextPage(false);
    setReviews([]);
    setDateStart(undefined);
    setDateEnd(undefined);
    setBackgroundVersionReviews([]);
    setRatingDist(EMPTY_RATING_DIST);
    setSentimentDist(EMPTY_SENTIMENT_DIST);
    setKeywords([]);

    try {
      const result = await fetchReviews(app.id, store, country, 1, app.name);
      setLastCollectedAt(result.lastCollectedAt ?? null);

      if (result.success && result.reviews && result.reviews.length > 0) {
        let allReviews: ReviewResult[] = result.reviews;
        setHasNextPage(result.hasNextPage || false);
        setCurrentPage(1);

      // Target Version Smart Scan: scan loaded data for v-Previous
        const versionSet = new Set<string>();
        for (const r of allReviews) {
          if (r.version) versionSet.add(r.version);
        }

        // Background Version Match: fetch additional pages in background for version comparison only
        // These reviews are NEVER added to the main review list
        if (versionSet.size <= 1 && result.hasNextPage) {
          const bgFetch = async () => {
            let bgPage = 2;
            const maxBgPages = 6; // try up to 5 additional pages
            let bgReviews: ReviewResult[] = [];
            while (bgPage <= maxBgPages) {
              try {
                const bgResult = await fetchReviews(app.id, store, country, bgPage);
                if (!bgResult.success || !bgResult.reviews?.length) break;
                bgReviews = [...bgReviews, ...bgResult.reviews];
                for (const r of bgResult.reviews) {
                  if (r.version) versionSet.add(r.version);
                }
                if (versionSet.size > 1) break;
                if (!bgResult.hasNextPage) break;
                bgPage++;
              } catch { break; }
            }
            if (bgReviews.length > 0) {
              setBackgroundVersionReviews(bgReviews);
            }
          };
          bgFetch(); // fire-and-forget background fetch
        }

        setReviews(allReviews);

        const dist = [5, 4, 3, 2, 1].map(r => ({
          rating: r,
          count: allReviews.filter((rev: ReviewResult) => rev.rating === r).length,
        }));
        setRatingDist(dist);

        await analyzeAndUpdate(allReviews);
      } else {
        setFetchFailed(true);
        setEmptyMessage(result.message ?? null);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setFetchFailed(true);
    } finally {
      setLoading(false);
    }
  }, [store, country, analyzeAndUpdate]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedApp || loadingMore || !hasNextPage) return;

    const scrollY = window.scrollY;
    const nextPage = currentPage + 1;
    setLoadingMore(true);

    try {
      const result = await fetchReviews(selectedApp.id, store, country, nextPage);

      if (result.success && result.reviews && result.reviews.length > 0) {
        const newReviews = result.reviews;
        setCurrentPage(nextPage);
        setHasNextPage(result.hasNextPage || false);

        setReviews(prev => [...prev, ...newReviews]);

        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });

        setAnalyzing(true);
        try {
          // Only analyze new reviews (existing ones already have badges)
          const analysis = await analyzeReviews(newReviews);
          if (analysis.success) {
            setReviews(prev => {
              const sentimentMap = new Map<string, ReviewResult>();
              for (const r of analysis.reviews) {
                sentimentMap.set(r.id, r);
              }
              // Merge: new reviews get badges, existing ones keep theirs
              const merged = prev.map(r => sentimentMap.get(r.id) || r);

              // Recompute sentiment distribution from all reviews
              const c = getStoreColors(store);
              const pos = merged.filter(r => r.sentiment === 'positive').length;
              const neg = merged.filter(r => r.sentiment === 'negative').length;
              const neu = merged.filter(r => r.sentiment === 'neutral').length;
              setSentimentDist([
                { name: '긍정', value: pos, color: c.positive },
                { name: '부정', value: neg, color: c.negative },
                { name: '중립', value: neu, color: c.neutral },
              ]);

              return merged;
            });
            if (analysis.keywords?.length > 0) {
              setKeywords(analysis.keywords);
            }
          }
        } catch (err) {
          console.error('Analysis error:', err);
        } finally {
          setAnalyzing(false);
        }
      } else {
        setHasNextPage(false);
      }
    } catch (e) {
      console.error('Load more error:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [selectedApp, store, currentPage, hasNextPage, loadingMore]);

  // Churn detection
  const churnData = useMemo(() => {
    return detectChurnWarnings([...dateFilteredReviews]);
  }, [dateFilteredReviews]);

  const churnUsers = churnData.churnUsers;

  const filteredReviews = useMemo(() => {
    const filtered = dateFilteredReviews.filter(r => {
      if (ratingFilter && r.rating !== ratingFilter) return false;
      if (sentimentFilter && r.sentiment !== sentimentFilter) return false;
      return true;
    });
    // Sort churn warnings to top
    return filtered.sort((a, b) => {
      if (a.isChurnWarning && !b.isChurnWarning) return -1;
      if (!a.isChurnWarning && b.isChurnWarning) return 1;
      return 0;
    });
  }, [dateFilteredReviews, ratingFilter, sentimentFilter]);

  const avgRating = useMemo(() => {
    if (dateFilteredReviews.length === 0) return 0;
    return Math.round((dateFilteredReviews.reduce((s, r) => s + r.rating, 0) / dateFilteredReviews.length) * 10) / 10;
  }, [dateFilteredReviews]);

  // Date span of the loaded data (independent of the selected date range)
  const dataSpan = useMemo(() => {
    if (reviews.length === 0) return null;
    let newest = reviews[0].date;
    let oldest = reviews[0].date;
    let newestTime = new Date(newest).getTime();
    let oldestTime = newestTime;
    for (const r of reviews) {
      const t = new Date(r.date).getTime();
      if (Number.isNaN(t)) continue;
      if (t > newestTime) { newestTime = t; newest = r.date; }
      if (t < oldestTime) { oldestTime = t; oldest = r.date; }
    }
    return {
      newest: newest.slice(0, 10),
      oldest: oldest.slice(0, 10),
      shorterThanRange: !!dateStart && oldestTime > dateStart.getTime(),
    };
  }, [reviews, dateStart]);

  const hasStats = dateFilteredReviews.length > 0;

  const ratingTrend = useMemo(() => {
    if (dateFilteredReviews.length === 0) return { change: 0, direction: 'neutral' as const };
    const now = new Date();
    const thisMonth = dateFilteredReviews.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = dateFilteredReviews.filter(r => {
      const d = new Date(r.date);
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    });
    const thisAvg = thisMonth.length > 0 ? thisMonth.reduce((s, r) => s + r.rating, 0) / thisMonth.length : avgRating;
    const lastAvg = lastMonth.length > 0 ? lastMonth.reduce((s, r) => s + r.rating, 0) / lastMonth.length : thisAvg;
    const change = lastAvg > 0 ? Math.round(((thisAvg - lastAvg) / lastAvg) * 1000) / 10 : 0;
    return { change, direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const };
  }, [dateFilteredReviews, avgRating]);

  const reviewDensity = useMemo(() => {
    if (dateFilteredReviews.length === 0) return 0;
    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const recentCount = dateFilteredReviews.filter(r => now - new Date(r.date).getTime() < week).length;
    return Math.round((recentCount / 7) * 10) / 10;
  }, [dateFilteredReviews]);

  const computedRatingDist = useMemo(() => {
    if (dateFilteredReviews.length === 0) return ratingDist;
    return [5, 4, 3, 2, 1].map(r => ({
      rating: r,
      count: dateFilteredReviews.filter((rev: ReviewResult) => rev.rating === r).length,
    }));
  }, [dateFilteredReviews, ratingDist]);

  const computedSentimentDist = useMemo(() => {
    const analyzed = dateFilteredReviews.filter(r => r.sentiment);
    if (analyzed.length === 0) return sentimentDist;
    const pos = analyzed.filter(r => r.sentiment === 'positive').length;
    const neg = analyzed.filter(r => r.sentiment === 'negative').length;
    const neu = analyzed.filter(r => r.sentiment === 'neutral').length;
    const c = getStoreColors(store);
    return [
      { name: '긍정', value: pos, color: c.positive },
      { name: '부정', value: neg, color: c.negative },
      { name: '중립', value: neu, color: c.neutral },
    ];
  }, [dateFilteredReviews, sentimentDist]);

  // Compute keyword sentiments from date-filtered reviews for bar chart
  const computedKeywords = useMemo(() => {
    const analyzed = dateFilteredReviews.filter(r => r.sentiment && r.keywords && r.keywords.length > 0);
    if (analyzed.length === 0) {
      // fallback: use keywords prop but add sentiment based on existing data
      return keywords.map(k => ({ ...k, sentiment: undefined as 'positive' | 'negative' | 'neutral' | undefined }));
    }
    const kwMap = new Map<string, { weight: number; pos: number; neg: number; neu: number }>();
    for (const r of analyzed) {
      for (const kw of r.keywords!) {
        const entry = kwMap.get(kw) || { weight: 0, pos: 0, neg: 0, neu: 0 };
        entry.weight++;
        if (r.sentiment === 'positive') entry.pos++;
        else if (r.sentiment === 'negative') entry.neg++;
        else entry.neu++;
        kwMap.set(kw, entry);
      }
    }
    return Array.from(kwMap.entries()).map(([text, v]) => ({
      text,
      weight: v.weight,
      sentiment: (v.pos >= v.neg && v.pos >= v.neu ? 'positive' : v.neg >= v.pos ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
    }));
  }, [dateFilteredReviews, keywords]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mesh gradient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[hsl(211,100%,92%)] opacity-40 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-[hsl(265,50%,92%)] opacity-30 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-[hsl(200,60%,93%)] opacity-25 blur-[100px]" />
      </div>
      <header className="border-b border-border/50 bg-white/30 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div>
              <h1 className="text-2xl font-display font-bold">
                <span className="gradient-text">App Review</span>{' '}
                <span className="text-foreground">Analytics</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">앱 리뷰를 검색하고 분석하세요</p>
            </div>
            <div className="sm:hidden shrink-0">
              <CountrySelector selected={country} onSelect={c => { setCountry(c); setSelectedApp(null); setReviews([]); setFetchFailed(false); }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StoreSelector selected={store} onSelect={s => { setStore(s); setSelectedApp(null); setReviews([]); setFetchFailed(false); }} />
            <div className="hidden sm:block">
              <CountrySelector selected={country} onSelect={c => { setCountry(c); setSelectedApp(null); setReviews([]); setFetchFailed(false); }} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Segmented Control */}
        <section className="flex justify-center">
          <SegmentedControl
            tabs={['앱 분석', '앱 비교']}
            activeIndex={activeTab}
            onChange={setActiveTab}
          />
        </section>

        {activeTab === 0 ? (
          <>
            <section className="flex justify-center">
              <AppSearchBar store={store} country={country} onSelectApp={handleSelectApp} />
            </section>

            {selectedApp && (
              <section className="glass-card p-6 flex items-center gap-5 animate-fade-in">
                {selectedApp.icon ? (
                  <img src={selectedApp.icon} alt={selectedApp.name} className="w-16 h-16 rounded-2xl" />
                ) : (
                  <span className="text-5xl">📱</span>
                )}
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">{selectedApp.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedApp.developer}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-neutral font-display font-semibold">⭐ {selectedApp.rating}</span>
                    <span className="text-muted-foreground text-sm">· {selectedApp.reviewCount?.toLocaleString()} 리뷰</span>
                  </div>
                </div>
                {(loading || analyzing) && (
                  <div className="ml-auto flex items-center gap-2 text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{analyzing ? '감성 분석 중...' : '리뷰 로딩 중...'}</span>
                  </div>
                )}
              </section>
            )}

            <section>
              <DateRangePicker
                startDate={dateStart}
                endDate={dateEnd}
                onStartDateChange={setDateStart}
                onEndDateChange={setDateEnd}
                dataInfo={dataSpan && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>가장 최근 리뷰: {dataSpan.newest} · 가장 오래된 리뷰: {dataSpan.oldest}</p>
                    {lastCollectedAt && <p>마지막 수집: {format(new Date(lastCollectedAt), 'yyyy-MM-dd HH:mm')}</p>}
                    {dataSpan.shorterThanRange && <p>애플이 제공하는 최신 500개와 그 이후 수집된 리뷰만 표시돼요</p>}
                  </div>
                )}
              />
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="총 리뷰 수" value={hasStats ? dateFilteredReviews.length.toLocaleString() : EMPTY_VALUE} />
              <StatCard icon={<Star className="w-5 h-5" />} label="평균 평점" value={hasStats ? String(avgRating) : EMPTY_VALUE} />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="평점 변동 추이"
                value={hasStats ? `${ratingTrend.change >= 0 ? '+' : ''}${ratingTrend.change}%` : EMPTY_VALUE}
                subtext={!hasStats ? undefined : ratingTrend.direction === 'up' ? '▲ 전월 대비 상승' : ratingTrend.direction === 'down' ? '▼ 전월 대비 하락' : '— 변동 없음'}
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5" />}
                label="리뷰 밀도"
                value={hasStats ? `${reviewDensity}` : EMPTY_VALUE}
                subtext="최근 7일 일평균"
              />
            </section>

            {/* Churn Warning Widget */}
            <section>
              <ChurnWarningWidget
                users={churnUsers}
                store={store}
                onClickUser={(reviewId) => {
                  const el = document.getElementById(`review-${reviewId}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SentimentChart data={computedSentimentDist} store={store} />
              <RatingDistribution data={computedRatingDist} store={store} />
              <SentimentTrend reviews={dateFilteredReviews} store={store} />
              <KeywordBarChart keywords={computedKeywords} store={store} />
            </section>

            {/* Version Comparison - below charts */}
            <section>
              <VersionComparisonBar reviews={dateFilteredReviews} store={store} keywords={computedKeywords} backgroundReviews={backgroundVersionReviews} />
            </section>

            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
                <h3 className="text-xl font-display font-bold text-foreground">
                  최신 리뷰
                  {dateFilteredReviews.length > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({filteredReviews.length}건)</span>}
                </h3>
                <ReviewFilters
                  selectedRating={ratingFilter}
                  selectedSentiment={sentimentFilter}
                  onRatingChange={setRatingFilter}
                  onSentimentChange={setSentimentFilter}
                  store={store}
                />
              </div>
              <div className="grid gap-4">
                {loading ? (
                  <div className="glass-card p-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">리뷰를 가져오는 중...</p>
                  </div>
                ) : selectedApp && fetchFailed && reviews.length === 0 ? (
                  <div className="glass-card p-12 text-center space-y-4">
                    <p className="text-muted-foreground">
                      {emptyMessage ?? <>지금 애플에서 리뷰를 받아오지 못했어요.<br />애플 피드가 일시적으로 비어 있을 수 있어요.</>}
                    </p>
                    {!emptyMessage && (
                      <button
                        type="button"
                        onClick={() => handleSelectApp(selectedApp)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card hover:border-primary/50 transition-all duration-300 text-foreground font-display font-medium"
                      >
                        <RefreshCw className="w-4 h-4" /> 다시 시도
                      </button>
                    )}
                  </div>
                ) : filteredReviews.length > 0 ? (
                  filteredReviews.map(review => <ReviewCard key={review.id} review={review} store={store} />)
                ) : (
                  <div className="glass-card p-12 text-center">
                    <p className="text-muted-foreground">
                      {reviews.length === 0 ? '앱을 검색하여 리뷰를 확인하세요.' : '해당 조건의 리뷰가 없습니다.'}
                    </p>
                  </div>
                )}
              </div>

              {hasNextPage && (
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl glass-card hover:border-primary/50 transition-all duration-300 text-foreground font-display font-medium disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> 로딩 중...</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> 리뷰 더 보기</>
                    )}
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <CompetitorComparison
            store={store}
            country={country}
            myApp={selectedApp}
            myReviews={dateFilteredReviews}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
