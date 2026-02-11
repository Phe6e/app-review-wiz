import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartChange: (d: Date | undefined) => void;
  onEndChange: (d: Date | undefined) => void;
}

const DateRangePicker = ({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) => {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const handleClear = () => {
    onStartChange(undefined);
    onEndChange(undefined);
  };

  const hasFilter = startDate || endDate;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground font-medium">기간:</span>

      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-9 px-3 text-sm justify-start font-normal bg-secondary border-border',
              !startDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
            {startDate ? format(startDate, 'yyyy.MM.dd') : '시작일'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(d) => { onStartChange(d); setStartOpen(false); }}
            disabled={(d) => (endDate ? d > endDate : false)}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground text-sm">~</span>

      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-9 px-3 text-sm justify-start font-normal bg-secondary border-border',
              !endDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
            {endDate ? format(endDate, 'yyyy.MM.dd') : '종료일'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(d) => { onEndChange(d); setEndOpen(false); }}
            disabled={(d) => (startDate ? d < startDate : false)}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <button
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          title="날짜 필터 초기화"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default DateRangePicker;
