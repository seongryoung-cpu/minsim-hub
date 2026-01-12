import { motion } from 'framer-motion';
import { Clock, ExternalLink, Newspaper, Mic, Flag, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { NewsArticle } from '@/types/news';
import { SEOUL_MAYOR_CANDIDATES, GYEONGGI_GOVERNOR_CANDIDATES } from '@/types/election';

const ALL_CANDIDATES = [...SEOUL_MAYOR_CANDIDATES, ...GYEONGGI_GOVERNOR_CANDIDATES];

const CATEGORY_CONFIG = {
  policy: { icon: FileText, label: '정책', color: 'text-blue-500 bg-blue-500/10' },
  campaign: { icon: Flag, label: '캠페인', color: 'text-green-500 bg-green-500/10' },
  interview: { icon: Mic, label: '인터뷰', color: 'text-purple-500 bg-purple-500/10' },
  general: { icon: Newspaper, label: '일반', color: 'text-muted-foreground bg-secondary' },
};

interface NewsCardProps {
  article: NewsArticle;
  index: number;
  showCandidate?: boolean;
}

export function NewsCard({ article, index, showCandidate = true }: NewsCardProps) {
  const candidate = ALL_CANDIDATES.find(c => c.id === article.candidateId);
  const categoryConfig = CATEGORY_CONFIG[article.category];
  const CategoryIcon = categoryConfig.icon;

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="flex gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category & Time */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${categoryConfig.color}`}>
              <CategoryIcon size={12} />
              {categoryConfig.label}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2 leading-snug">
            {article.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {article.summary}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showCandidate && candidate && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${candidate.partyColor}15`,
                    color: candidate.partyColor,
                  }}
                >
                  {candidate.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{article.source}</span>
            </div>
            <ExternalLink size={14} className="text-muted-foreground" />
          </div>
        </div>

        {/* Image placeholder if exists */}
        {article.imageUrl && (
          <div className="w-20 h-20 rounded-xl bg-secondary flex-shrink-0 overflow-hidden">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)] animate-pulse">
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-secondary rounded-full" />
            <div className="h-5 w-20 bg-secondary rounded-full" />
          </div>
          <div className="h-5 w-full bg-secondary rounded" />
          <div className="h-4 w-3/4 bg-secondary rounded" />
          <div className="h-4 w-1/2 bg-secondary rounded" />
        </div>
      </div>
    </div>
  );
}
