import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CountrySelectorProps {
  selected: string;
  onSelect: (country: string) => void;
}

const countries = [
  { code: 'kr', label: '🇰🇷 KR' },
  { code: 'jp', label: '🇯🇵 JP' },
  { code: 'us', label: '🇺🇸 US' },
];

const CountrySelector = ({ selected, onSelect }: CountrySelectorProps) => {
  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger className="w-28 glass-card border-border font-display font-medium text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50">
        {countries.map(c => (
          <SelectItem key={c.code} value={c.code} className="font-display text-sm">
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;
