import Flag from 'react-world-flags';
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
  { code: 'kr', flagCode: 'KR', label: 'KR' },
  { code: 'jp', flagCode: 'JP', label: 'JP' },
  { code: 'us', flagCode: 'US', label: 'US' },
];

const CountrySelector = ({ selected, onSelect }: CountrySelectorProps) => {
  const selectedCountry = countries.find(c => c.code === selected);

  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger className="w-28 glass-card border-border font-display font-medium text-sm">
        <div className="flex items-center gap-2">
          {selectedCountry && (
            <Flag code={selectedCountry.flagCode} className="w-5 h-3.5 rounded-sm object-cover" />
          )}
          <span>{selectedCountry?.label}</span>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50">
        {countries.map(c => (
          <SelectItem key={c.code} value={c.code} className="font-display text-sm">
            <div className="flex items-center gap-2">
              <Flag code={c.flagCode} className="w-5 h-3.5 rounded-sm object-cover" />
              <span>{c.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;
