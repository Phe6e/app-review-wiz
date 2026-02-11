interface CountrySelectorProps {
  selected: string;
  onSelect: (country: string) => void;
}

const countries = [
  { code: 'kr', label: '🇰🇷 대한민국', flag: '🇰🇷' },
  { code: 'jp', label: '🇯🇵 日本', flag: '🇯🇵' },
  { code: 'us', label: '🇺🇸 United States', flag: '🇺🇸' },
];

const CountrySelector = ({ selected, onSelect }: CountrySelectorProps) => {
  return (
    <div className="flex gap-2">
      {countries.map(c => (
        <button
          key={c.code}
          onClick={() => onSelect(c.code)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-medium text-sm transition-all duration-300 ${
            selected === c.code
              ? 'bg-primary text-primary-foreground glow'
              : 'glass-card text-muted-foreground hover:text-foreground hover:border-primary/30'
          }`}
        >
          <span>{c.flag}</span>
          <span>{c.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
};

export default CountrySelector;
