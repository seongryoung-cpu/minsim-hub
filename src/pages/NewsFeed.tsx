import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Newspaper, Bell, UserPlus, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';
import { useNews } from '@/hooks/useNews';
import { useCandidates } from '@/hooks/useCandidates';
import { NewsCard, NewsCardSkeleton } from '@/components/news/NewsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingSpinner } from '@/components/ui/loading-state';

export function NewsFeed() {
  const navigate = useNavigate();
  const { followedIds, isLoaded } = useFollowedCandidates();
  const [activeTab, setActiveTab] = useState<'personalized' | 'all'>('personalized');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Fetch candidates from DB instead of hardcoded list
  const { data: dbCandidates = [], isLoading: isCandidatesLoading } = useCandidates();

  // Fetch all news from DB
  const { data: allNews, isLoading: isAllNewsLoading, error: allNewsError, refetch: refetchAllNews } = useNews();
  
  // Fetch personalized news based on followed candidates
  const targetIds = useMemo(() => {
    return selectedFilters.length > 0 ? selectedFilters : followedIds;
  }, [selectedFilters, followedIds]);
  
  const { data: personalizedNews, isLoading: isPersonalizedLoading, error: personalizedError, refetch: refetchPersonalized } = useNews(
    targetIds.length > 0 ? targetIds : undefined
  );

  // Map followed IDs to actual candidate data from DB
  const followedCandidates = useMemo(() => {
    return dbCandidates.filter(c => followedIds.includes(c.id));
  }, [dbCandidates, followedIds]);

  const toggleFilter = (candidateId: string) => {
    setSelectedFilters(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const displayedPersonalizedNews = useMemo(() => {
    if (!personalizedNews) return [];
    if (targetIds.length === 0) return [];
    return personalizedNews.filter(news => targetIds.includes(news.candidateId));
  }, [personalizedNews, targetIds]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24 lg:pb-8"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Newspaper size={20} className="text-primary" />
              <h1 className="font-semibold text-lg">뉴스 피드</h1>
            </div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <Bell size={20} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Followed Candidates Filter Strip */}
        {followedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                후보자별 필터
              </h2>
              <div className="flex items-center gap-2">
                {selectedFilters.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    초기화
                  </button>
                )}
                <button
                  onClick={() => navigate('/election')}
                  className="text-xs text-primary font-medium"
                >
                  관리
                </button>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {followedCandidates.map(candidate => {
                const isSelected = selectedFilters.includes(candidate.id);
                const isActive = selectedFilters.length === 0 || isSelected;
                return (
                  <button
                    key={candidate.id}
                    onClick={() => toggleFilter(candidate.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all flex-shrink-0 border ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : isActive
                        ? 'border-transparent bg-secondary/50 hover:bg-secondary'
                        : 'border-transparent bg-secondary/30 opacity-50 hover:opacity-75'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold relative"
                      style={{
                        backgroundColor: `${candidate.partyColor}20`,
                        color: candidate.partyColor,
                      }}
                    >
                      {isSelected ? (
                        <Check size={14} className="text-primary" />
                      ) : (
                        candidate.name[0]
                      )}
                    </div>
                    <span className="text-sm font-medium">{candidate.name}</span>
                  </button>
                );
              })}
            </div>
            {selectedFilters.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {selectedFilters.length}명의 후보자 뉴스만 표시 중
              </p>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'personalized' | 'all')}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="personalized" className="flex items-center gap-2">
              <Sparkles size={14} />
              맞춤 뉴스
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Newspaper size={14} />
              전체 뉴스
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Personalized Feed */}
            <TabsContent value="personalized" className="mt-4">
              {!isLoaded || isPersonalizedLoading || isCandidatesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <NewsCardSkeleton key={i} />
                  ))}
                </div>
              ) : personalizedError ? (
                <ErrorState
                  onRetry={() => refetchPersonalized()}
                  description="뉴스를 불러오는 중 오류가 발생했습니다"
                />
              ) : followedIds.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="관심 후보자를 팔로우하세요"
                  description="후보자를 팔로우하면 관련 뉴스를 모아서 볼 수 있어요"
                  actionLabel="후보자 둘러보기"
                  onAction={() => navigate('/election')}
                />
              ) : displayedPersonalizedNews.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title="관련 뉴스가 없습니다"
                  description="선택한 후보자에 대한 뉴스가 아직 없습니다"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {displayedPersonalizedNews.map((article, index) => (
                    <NewsCard key={article.id} article={article} index={index} />
                  ))}
                </motion.div>
              )}
            </TabsContent>

            {/* All News Feed */}
            <TabsContent value="all" className="mt-4">
              {isAllNewsLoading ? (
                <LoadingSpinner />
              ) : allNewsError ? (
                <ErrorState 
                  onRetry={() => refetchAllNews()}
                  description="뉴스를 불러오는 중 오류가 발생했습니다"
                />
              ) : (allNews || []).length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title="뉴스가 없습니다"
                  description="아직 등록된 뉴스가 없습니다"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {(allNews || []).map((article, index) => (
                    <NewsCard key={article.id} article={article} index={index} />
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </motion.div>
  );
}
