interface KeywordCloudProps {
  keywords?: { text: string; weight: number }[];
}

const defaultKeywords = [
  { text: '디자인', weight: 85 }, { text: 'UI', weight: 72 }, { text: '업데이트', weight: 90 },
  { text: '배터리', weight: 65 }, { text: '기능', weight: 95 }, { text: '속도', weight: 60 },
  { text: '편리함', weight: 82 }, { text: '콘텐츠', weight: 67 }, { text: '추천', weight: 75 },
];

const KeywordCloud = ({ keywords = defaultKeywords }: KeywordCloudProps) => {
  const maxWeight = Math.max(...keywords.map(k => k.weight), 1);
  const minWeight = Math.min(...keywords.map(k => k.weight));

  const getSize = (weight: number) => {
    const ratio = maxWeight === minWeight ? 0.5 : (weight - minWeight) / (maxWeight - minWeight);
    return 14 + ratio * 22;
  };

  const getOpacity = (weight: number) => {
    const ratio = maxWeight === minWeight ? 1 : (weight - minWeight) / (maxWeight - minWeight);
    return 0.5 + ratio * 0.5;
  };

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-4">주요 키워드</h3>
      <div className="flex flex-wrap gap-3 items-center justify-center min-h-[160px]">
        {keywords.map((keyword, i) => (
          <span
            key={keyword.text}
            className="font-display font-medium text-primary cursor-default transition-all duration-300 hover:scale-110"
            style={{
              fontSize: `${getSize(keyword.weight)}px`,
              opacity: getOpacity(keyword.weight),
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
