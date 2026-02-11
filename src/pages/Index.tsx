import { useState, useMemo, useCallback } from 'react';
import { Star, MessageSquare, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import StoreSelector from '@/components/StoreSelector';
import AppSearchBar from '@/components/AppSearchBar';
import ReviewCard from '@/components/ReviewCard';
import ReviewFilters from '@/components/ReviewFilters';
import SentimentChart from '@/components/SentimentChart';
import RatingDistribution from '@/components/RatingDistribution';
import SentimentTrend from '@/components/SentimentTrend';
import KeywordCloud from '@/components/KeywordCloud';
import StatCard from '@/components/StatCard';
import { Store, AppResult, ReviewResult, fetchReviews, analyzeReviews } from '@/lib/api';
import { Sentiment, mockReviews, mockKeywords, sentimentData, ratingDistribution, trendData } from '@/data/mockData';

const Index = () => {
  const [store, setStore] = useState<Store>('apple');
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

  const handleSelectApp = useCallback(async (app: AppResult) => {
    setSelectedApp(app);
    setLoading(true);
    setIsUsingMockData(false);

    try {
      const result = await fetchReviews(app.id, store);
      
      if (result.success && result.reviews && result.reviews.length > 0) {
        setReviews(result.reviews);
        
        // Calculate rating distribution from real data
        const dist = [5, 4, 3, 2, 1].map(r => ({
          rating: r,
          count: result.reviews.filter((rev: ReviewResult) => rev.rating === r).length,
        }));
        setRatingDist(dist);

        // Analyze sentiment with AI
        setAnalyzing(true);
        try {
          const analysis = await analyzeReviews(result.reviews);
          if (analysis.success) {
            setReviews(analysis.reviews);
            if (analysis.keywords?.length > 0) {
              setKeywords(analysis.keywords);
            }
            if (analysis.sentimentDistribution) {
              const sd = analysis.sentimentDistribution;
              setSentimentDist([
                { name: '긍정', value: sd.positive || 0, color: 'hsl(152, 60%, 48%)' },
                { name: '부정', value: sd.negative || 0, color: 'hsl(0, 72%, 55%)' },
                { name: '중립', value: sd.neutral || 0, color: 'hsl(38, 92%, 55%)' },
              ]);
            }
          }
        } catch (e) {
          console.error('Analysis error:', e);
        } finally {
          setAnalyzing(false);
        }
      } else {
        // Fallback to mock data
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
  }, [store]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (ratingFilter && r.rating !== ratingFilter) return false;
      if (sentimentFilter && r.sentiment !== sentimentFilter) return false;
      return true;
    });
  }, [reviews, ratingFilter, sentimentFilter]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return selectedApp?.rating || 0;
    return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
  }, [reviews, selectedApp]);

  const positiveRate = useMemo(() => {
    const pos = reviews.filter(r => r.sentiment === 'positive').length;
    return reviews.length > 0 ? Math.round((pos / reviews.length) * 100) : 0;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">
              <span className="gradient-text">App Review</span>{' '}
              <span className="text-foreground">Analytics</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">앱 리뷰를 검색하고 분석하세요</p>
          </div>
          <StoreSelector selected={store} onSelect={s => { setStore(s); setSelectedApp(null); setReviews([]); setIsUsingMockData(true); }} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="flex justify-center">
          <AppSearchBar store={store} onSelectApp={handleSelectApp} />
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

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<MessageSquare className="w-5 h-5" />} label="총 리뷰 수" value={reviews.length > 0 ? reviews.length.toLocaleString() : selectedApp?.reviewCount?.toLocaleString() || '0'} />
          <StatCard icon={<Star className="w-5 h-5" />} label="평균 평점" value={String(avgRating)} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="긍정 비율" value={`${positiveRate}%`} />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="분석 리뷰" value={String(reviews.filter(r => r.sentiment).length)} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SentimentChart data={sentimentDist} />
          <RatingDistribution data={ratingDist} />
          <SentimentTrend />
          <KeywordCloud keywords={keywords} />
        </section>

        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <h3 className="text-xl font-display font-bold text-foreground">
              최신 리뷰
              {reviews.length > 0 && <span className="text-sm font-normal text-muted-foreground ml-2">({filteredReviews.length}건)</span>}
            </h3>
            <ReviewFilters
              selectedRating={ratingFilter}
              selectedSentiment={sentimentFilter}
              onRatingChange={setRatingFilter}
              onSentimentChange={setSentimentFilter}
            />
          </div>
          <div className="grid gap-4">
            {loading ? (
              <div className="glass-card p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">리뷰를 가져오는 중...</p>
              </div>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map(review => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="glass-card p-12 text-center">
                <p className="text-muted-foreground">
                  {reviews.length === 0 ? '앱을 검색하여 리뷰를 확인하세요.' : '해당 조건의 리뷰가 없습니다.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
