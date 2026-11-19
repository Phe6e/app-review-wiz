import { useState, type ReactNode } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  /** Optional note about the date span of the loaded data */
  dataInfo?: ReactNode;
}

const presets = [
  { label: '直近7日', days: 7 },
  { label: '直近30日', days: 30 },
  { label: '直近90日', days: 90 },
  { label: 'すべて', days: 0 },
];

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, dataInfo }: DateRangePickerProps) => {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const handlePreset = (days: number) => {
    if (days === 0) {
      onStartDateChange(undefined);
      onEndDateChange(undefined);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      onStartDateChange(start);
      onEndDateChange(end);
    }
  };

  return (
    <div className="glass-card p-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-display font-semibold text-foreground">📅 期間</span>

      <div className="flex items-center gap-2">
        {presets.map(p => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => handlePreset(p.days)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('w-[140px] justify-start text-left text-xs h-8', !startDate && 'text-muted-foreground')}>
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              {startDate ? format(startDate, 'yyyy-MM-dd') : '開始日'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(d) => { onStartDateChange(d); setStartOpen(false); }}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground text-xs">~</span>

        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('w-[140px] justify-start text-left text-xs h-8', !endDate && 'text-muted-foreground')}>
              <CalendarIcon className="mr-1 h-3.5 w-3.5" />
              {endDate ? format(endDate, 'yyyy-MM-dd') : '終了日'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(d) => { onEndDateChange(d); setEndOpen(false); }}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>
      </div>

      {dataInfo && <div className="w-full">{dataInfo}</div>}
    </div>
  );
};

export default DateRangePicker;
