import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CATEGORY_COLORS, type UserChoice, type PolicyCard } from '@/types/policy';

interface CategoryInsightsProps {
  choices: UserChoice[];
  cards: PolicyCard[];
}

export function CategoryInsights({ choices, cards }: CategoryInsightsProps) {
  // 카드에서 카테고리 목록 추출
  const categories = useMemo(() => {
    return [...new Set(cards.map(c => c.category))];
  }, [cards]);

  // 카테고리별 선택 집계
  const categoryStats = categories.map(category => {
    const categoryCards = cards.filter(c => c.category === category);
    const categoryChoices = choices.filter(choice => {
      const card = cards.find(c => c.id === choice.cardId);
      return card?.category === category;
    });

    const agreeCount = categoryChoices.filter(c => c.direction === 'right').length;
    const disagreeCount = categoryChoices.filter(c => c.direction === 'left').length;
    const total = categoryChoices.length;

    return {
      category,
      color: CATEGORY_COLORS[category] || '#6366F1',
      agreeCount,
      disagreeCount,
      total,
      maxCards: categoryCards.length,
      agreePercent: total > 0 ? (agreeCount / total) * 100 : 0,
    };
  }).filter(stat => stat.total > 0);

  if (categoryStats.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border/50"
    >
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        카테고리별 선택 현황
      </h4>
      <div className="space-y-2">
        {categoryStats.map((stat) => (
          <div key={stat.category} className="flex items-center gap-3">
            {/* Category label */}
            <div className="w-14 text-xs font-medium truncate" style={{ color: stat.color }}>
              {stat.category}
            </div>
            
            {/* Progress bar */}
            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden flex">
              {/* Disagree portion */}
              <motion.div
                className="h-full bg-red-400"
                initial={{ width: 0 }}
                animate={{ width: `${(stat.disagreeCount / stat.maxCards) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* Agree portion */}
              <motion.div
                className="h-full bg-green-400"
                initial={{ width: 0 }}
                animate={{ width: `${(stat.agreeCount / stat.maxCards) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            
            {/* Count */}
            <div className="w-10 text-xs text-muted-foreground text-right">
              {stat.total}/{stat.maxCards}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground">찬성</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-xs text-muted-foreground">반대</span>
        </div>
      </div>
    </motion.div>
  );
}
