import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, RotateCcw } from 'lucide-react';
import { Sentiment } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export type SortOption = 'newest' | 'oldest' | 'rating_high' | 'rating_low';

interface ReviewFiltersProps {
  selectedRating: number | null;
  selectedSentiment: Sentiment | null;
  onRatingChange: (r: number | null) => void;
  onSentimentChange: (s: Sentiment | null) => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onReset: () => void;
}

const ReviewFilters = ({
  selectedRating, selectedSentiment, onRatingChange, onSentimentChange,
  sortOption, onSortChange, dateRange, onDateRangeChange, onReset,
}: ReviewFiltersProps) => {
  const ratings = [5, 4, 3, 2, 1];
  const sentiments: { value: Sentiment; label: string; className: string }[] = [
    { value: 'positive', label: '긍정', className: 'bg-positive/15 text-positive border-positive/30' },
    { value: 'negative', label: '부정', className: 'bg-negative/15 text-negative border-negative/30' },
    { value: 'neutral', label: '중립', className: 'bg-neutral/15 text-neutral border-neutral/30' },
  ];

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Row 1: Sort + Date Range + Reset */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={sortOption} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="oldest">오래된순</SelectItem>
            <SelectItem value="rating_high">별점 높은 순</SelectItem>
            <SelectItem value="rating_low">별점 낮은 순</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 text-sm gap-1.5", !dateRange.from && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateRange.from ? format(dateRange.from, 'yyyy.MM.dd') : '시작일'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(d) => { onDateRangeChange({ ...dateRange, from: d }); setFromOpen(false); }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-sm">~</span>

        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 text-sm gap-1.5", !dateRange.to && "text-muted-foreground")}>
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateRange.to ? format(dateRange.to, 'yyyy.MM.dd') : '종료일'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(d) => { onDateRangeChange({ ...dateRange, to: d }); setToOpen(false); }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" className="h-9 text-sm gap-1.5 text-muted-foreground" onClick={onReset}>
          <RotateCcw className="w-3.5 h-3.5" />
          초기화
        </Button>
      </div>

      {/* Row 2: Rating + Sentiment filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">평점:</span>
          <div className="flex gap-1.5">
            {ratings.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => onRatingChange(selectedRating === r ? null : r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedRating === r
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {r}★
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium">감성:</span>
          <div className="flex gap-1.5">
            {sentiments.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => onSentimentChange(selectedSentiment === s.value ? null : s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  selectedSentiment === s.value ? s.className : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
