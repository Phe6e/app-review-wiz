import { useState, useMemo, useCallback, useRef } from 'react';
import { Star, MessageSquare, TrendingUp, BarChart3, Loader2, ChevronDown } from 'lucide-react';
import StoreSelector from '@/components/StoreSelector';
import AppSearchBar from '@/components/AppSearchBar';
import ReviewCard from '@/components/ReviewCard';
import ReviewFilters from '@/components/ReviewFilters';
import SentimentChart from '@/components/SentimentChart';
import RatingDistribution from '@/components/RatingDistribution';
import SentimentTrend from '@/components/SentimentTrend';
import DateRangePicker from '@/components/DateRangePicker';
import StatCard from '@/components/StatCard';
import { Store, AppResult, ReviewResult, fetchReviews, analyzeReviews } from '@/lib/api';
import { Sentiment, mockReviews, mockKeywords, sentimentData, ratingDistribution } from '@/data/mockData';

const Index = () => {
  const [store, setStore] = useState<Store>('apple');
  const [selectedApp, setSelectedApp] = useState<AppResult | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<Sentiment | null>(null);
  const [keywordFilter, setKeywordFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
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
          setSentimentDist([
            { name: '긍정', value: sd.positive || 0, color: 'hsl(152, 55%, 45%)' },
            { name: '부정', value: sd.negative || 0, color: 'hsl(0, 65%, 55%)' },
            { name: '중립', value: sd.neutral || 0, color: 'hsl(38, 80%, 50%)' },
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
    setKeywordFilter(null);
    setStartDate(undefined);
    setEndDate(undefined);

    try {
      const result = await fetchReviews(app.id, store, 'kr', 1);

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
  }, [store, analyzeAndUpdate]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedApp || loadingMore || !hasNextPage) return;

    const scrollY = window.scrollY;
    const nextPage = currentPage + 1;
    setLoadingMore(true);

    try {
      const result = await fetchReviews(selectedApp.id, store, 'kr', nextPage);

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
              setSentimentDist([
                { name: '긍정', value: sd.positive || 0, color: 'hsl(152, 55%, 45%)' },
                { name: '부정', value: sd.negative || 0, color: 'hsl(0, 65%, 55%)' },
                { name: '중립', value: sd.neutral || 0, color: 'hsl(38, 80%, 50%)' },
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

  // --- Date-filtered reviews (base for ALL analytics) ---
  const dateFilteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (!startDate && !endDate) return true;
      const d = new Date(r.date);
      if (startDate && d < startDate) return false;
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    });
  }, [reviews, startDate, endDate]);

  // --- Full filtered reviews (for review list display) ---
  const filteredReviews = useMemo(() => {
    return dateFilteredReviews.filter(r => {
      if (ratingFilter && r.rating !== ratingFilter) return false;
      if (sentimentFilter && r.sentiment !== sentimentFilter) return false;
      if (keywordFilter && !r.content?.toLowerCase().includes(keywordFilter.toLowerCase()) && !r.title?.toLowerCase().includes(keywordFilter.toLowerCase())) return false;
      return true;
    });
  }, [dateFilteredReviews, ratingFilter, sentimentFilter, keywordFilter]);

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
    return [
      { name: '긍정', value: pos, color: 'hsl(152, 55%, 45%)' },
      { name: '부정', value: neg, color: 'hsl(0, 65%, 55%)' },
      { name: '중립', value: neu, color: 'hsl(38, 80%, 50%)' },
    ];
  }, [dateFilteredReviews, sentimentDist]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-2xl bg-card/70 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="gradient-text">App Review</span>{' '}
              <span className="text-foreground">Analytics</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">앱 리뷰를 검색하고 분석하세요</p>
          </div>
          <StoreSelector selected={store} onSelect={s => { setStore(s); setSelectedApp(null); setReviews([]); setIsUsingMockData(true); setKeywordFilter(null); setStartDate(undefined); setEndDate(undefined); }} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Search */}
        <section className="flex justify-center">
          <AppSearchBar store={store} onSelectApp={handleSelectApp} />
        </section>

        {/* App Info */}
        {selectedApp && (
          <section className="glass-card p-5 flex items-center gap-5 animate-fade-in">
            {selectedApp.icon ? (
              <img src={selectedApp.icon} alt={selectedApp.name} className="w-14 h-14 rounded-2xl shadow-sm" />
            ) : (
              <span className="text-4xl">📱</span>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{selectedApp.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedApp.developer}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neutral font-semibold text-sm">⭐ {selectedApp.rating}</span>
                <span className="text-muted-foreground text-xs">· {selectedApp.reviewCount?.toLocaleString()} 리뷰</span>
                {isUsingMockData && <span className="text-xs px-2 py-0.5 rounded-full bg-neutral/10 text-neutral">데모</span>}
              </div>
            </div>
            {(loading || analyzing) && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{analyzing ? '분석 중...' : '로딩 중...'}</span>
              </div>
            )}
          </section>
        )}

        {/* Date filter */}
        <section className="flex justify-end">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
        </section>

        {/* Stat Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="총 리뷰 수" value={dateFilteredReviews.length > 0 ? dateFilteredReviews.length.toLocaleString() : selectedApp?.reviewCount?.toLocaleString() || '0'} />
          <StatCard icon={<Star className="w-5 h-5" />} label="평균 평점" value={String(avgRating)} />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="평점 변동"
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

        {/* Charts Row: Sentiment Trend (left) + Donut + Rating (right) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SentimentTrend reviews={dateFilteredReviews} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SentimentChart data={computedSentimentDist} />
            <RatingDistribution data={computedRatingDist} />
          </div>
        </section>

        {/* Reviews Section */}
        <section>
          <div className="flex flex-col gap-4 mb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-foreground">
                최신 리뷰
                {filteredReviews.length > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({filteredReviews.length}건)</span>}
              </h3>
            </div>
            <ReviewFilters
              selectedRating={ratingFilter}
              selectedSentiment={sentimentFilter}
              onRatingChange={setRatingFilter}
              onSentimentChange={setSentimentFilter}
            />
          </div>
          <div className="grid gap-3">
            {loading ? (
              <div className="glass-card p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">리뷰를 가져오는 중...</p>
              </div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map(review => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-muted-foreground text-sm">
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
                className="flex items-center gap-2 px-6 py-3 rounded-2xl glass-card hover:ring-2 hover:ring-primary/20 transition-all duration-300 text-foreground font-medium text-sm disabled:opacity-50"
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
      </main>
    </div>
  );
};

export default Index;
