import { useState, useMemo, useCallback, useRef } from 'react';
import { Star, MessageSquare, TrendingUp, BarChart3, Loader2, ChevronDown } from 'lucide-react';
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
import { Store, AppResult, ReviewResult, fetchReviews, analyzeReviews } from '@/lib/api';
import { Sentiment, mockReviews, mockKeywords, sentimentData, ratingDistribution } from '@/data/mockData';
import { getStoreColors } from '@/lib/storeColors';

const Index = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [store, setStore] = useState<Store>('apple');
  const [country, setCountry] = useState('kr');
  const [selectedApp, setSelectedApp] = useState<AppResult | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null);
  const [reviews, setReviews] = useState<ReviewResult[]>([]);
  const [keywords, setKeywords] = useState(mockKeywords);
  const [sentimentDist, setSentimentDist] = useState(sentimentData);
  const [ratingDist, setRatingDist] = useState(ratingDistribution);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isUsingMockData, setIsUsingMockData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<Date | undefined>(() => new Date());

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
    setIsUsingMockData(false);
    setCurrentPage(1);
    setHasNextPage(false);
    setReviews([]);
    setDateStart(undefined);
    setDateEnd(undefined);

    try {
      const result = await fetchReviews(app.id, store, country, 1);

      if (result.success && result.reviews && result.reviews.length > 0) {
        setReviews(result.reviews);
        setHasNextPage(result.hasNextPage || false);
        setCurrentPage(1);

        const dist = [5, 4, 3, 2, 1].map(r => ({
          rating: r,
          count: result.reviews.filter((rev: ReviewResult) => rev.rating === r).length,
        }));
        setRatingDist(dist);

        await analyzeAndUpdate(result.reviews);
      } else {
        setIsUsingMockData(true);
        setReviews(mockReviews as unknown as ReviewResult[]);
        setRatingDist(ratingDistribution);
        setSentimentDist(sentimentData);
        setKeywords(mockKeywords);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setIsUsingMockData(true);
      setReviews(mockReviews as unknown as ReviewResult[]);
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

        const mergedReviewsPromise = new Promise<ReviewResult[]>((resolve) => {
          setReviews(prev => {
            const allReviews = [...prev, ...newReviews];
            resolve(allReviews);
            return allReviews;
          });
        });

        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });

        const allReviews = await mergedReviewsPromise;
        setAnalyzing(true);
        try {
          const analysis = await analyzeReviews(allReviews);
          if (analysis.success) {
            setReviews(prev => {
              const sentimentMap = new Map<string, ReviewResult>();
              for (const r of analysis.reviews) {
                sentimentMap.set(r.id, r);
              }
              return prev.map(r => sentimentMap.get(r.id) || r);
            });
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

  const filteredReviews = useMemo(() => {
    return dateFilteredReviews.filter(r => {
      if (ratingFilter && r.rating !== ratingFilter) return false;
      if (sentimentFilter && r.sentiment !== sentimentFilter) return false;
      return true;
    });
  }, [dateFilteredReviews, ratingFilter, sentimentFilter]);

  const avgRating = useMemo(() => {
    if (dateFilteredReviews.length === 0) return selectedApp?.rating || 0;
    return Math.round((dateFilteredReviews.reduce((s, r) => s + r.rating, 0) / dateFilteredReviews.length) * 10) / 10;
  }, [dateFilteredReviews, selectedApp]);

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
              <CountrySelector selected={country} onSelect={c => { setCountry(c); setSelectedApp(null); setReviews([]); setIsUsingMockData(true); }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StoreSelector selected={store} onSelect={s => { setStore(s); setSelectedApp(null); setReviews([]); setIsUsingMockData(true); }} />
            <div className="hidden sm:block">
              <CountrySelector selected={country} onSelect={c => { setCountry(c); setSelectedApp(null); setReviews([]); setIsUsingMockData(true); }} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Segmented Control */}
        <section className="flex justify-center">
          <SegmentedControl
            tabs={['내 앱 분석', '경쟁사 비교']}
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
                    {isUsingMockData && <span className="text-xs px-2 py-0.5 rounded-full bg-neutral/15 text-neutral">데모 데이터</span>}
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
              />
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<MessageSquare className="w-5 h-5" />} label="총 리뷰 수" value={dateFilteredReviews.length > 0 ? dateFilteredReviews.length.toLocaleString() : selectedApp?.reviewCount?.toLocaleString() || '0'} />
              <StatCard icon={<Star className="w-5 h-5" />} label="평균 평점" value={String(avgRating)} />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="평점 변동 추이"
                value={`${ratingTrend.change >= 0 ? '+' : ''}${ratingTrend.change}%`}
                subtext={ratingTrend.direction === 'up' ? '▲ 전월 대비 상승' : ratingTrend.direction === 'down' ? '▼ 전월 대비 하락' : '— 변동 없음'}
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5" />}
                label="리뷰 밀도"
                value={`${reviewDensity}`}
                subtext="최근 7일 일평균"
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SentimentChart data={computedSentimentDist} store={store} />
              <RatingDistribution data={computedRatingDist} store={store} />
              <SentimentTrend reviews={dateFilteredReviews} store={store} />
              <KeywordBarChart keywords={computedKeywords} store={store} />
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

              {hasNextPage && !isUsingMockData && (
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
