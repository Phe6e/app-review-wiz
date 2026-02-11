import { mockKeywords } from '@/data/mockData';

const KeywordCloud = () => {
  const maxWeight = Math.max(...mockKeywords.map(k => k.weight));
  const minWeight = Math.min(...mockKeywords.map(k => k.weight));

  const getSize = (weight: number) => {
    const ratio = (weight - minWeight) / (maxWeight - minWeight);
    return 14 + ratio * 22;
  };

  const getOpacity = (weight: number) => {
    const ratio = (weight - minWeight) / (maxWeight - minWeight);
    return 0.5 + ratio * 0.5;
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">주요 키워드</h3>
      <div className="flex flex-wrap gap-3 items-center justify-center min-h-[160px]">
        {mockKeywords.map((keyword, i) => (
          <span
            key={keyword.text}
            className="font-display font-medium text-primary cursor-default transition-all duration-300 hover:scale-110"
            style={{
              fontSize: `${getSize(keyword.weight)}px`,
              opacity: getOpacity(keyword.weight),
              animationDelay: `${i * 50}ms`,
            }}
          >
            {keyword.text}
          </span>
        ))}
      </div>
    </div>
  );
};

export default KeywordCloud;
