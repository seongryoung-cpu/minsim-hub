import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Newspaper, Bell, UserPlus, Sparkles, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useFollowedCandidates } from '@/hooks/useFollowedCandidates';
import { getNewsForCandidates, getAllNews } from '@/data/mockNews';
import { SEOUL_MAYOR_CANDIDATES, GYEONGGI_GOVERNOR_CANDIDATES } from '@/types/election';
import { NewsCard, NewsCardSkeleton } from '@/components/news/NewsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ALL_CANDIDATES = [...SEOUL_MAYOR_CANDIDATES, ...GYEONGGI_GOVERNOR_CANDIDATES];

export function NewsFeed() {
  const navigate = useNavigate();
  const { followedIds, isFollowing, toggleFollow, isLoaded } = useFollowedCandidates();
  const [activeTab, setActiveTab] = useState<'personalized' | 'all'>('personalized');

  const personalizedNews = useMemo(() => {
    if (!isLoaded) return [];
    return getNewsForCandidates(followedIds);
  }, [followedIds, isLoaded]);

  const allNews = useMemo(() => getAllNews(), []);

  const followedCandidates = useMemo(() => {
    return ALL_CANDIDATES.filter(c => followedIds.includes(c.id));
  }, [followedIds]);

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
        {/* Followed Candidates Strip */}
        {followedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                팔로우 중인 후보자
              </h2>
              <button
                onClick={() => navigate('/election')}
                className="text-xs text-primary font-medium"
              >
                관리
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {followedCandidates.map(candidate => (
                <button
                  key={candidate.id}
                  onClick={() => navigate(`/candidate/${candidate.id}`)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors flex-shrink-0"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: `${candidate.partyColor}20`,
                      color: candidate.partyColor,
                    }}
                  >
                    {candidate.name[0]}
                  </div>
                  <span className="text-sm font-medium">{candidate.name}</span>
                </button>
              ))}
            </div>
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
              {!isLoaded ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <NewsCardSkeleton key={i} />
                  ))}
                </div>
              ) : followedIds.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-2xl p-8 text-center shadow-[var(--shadow-md)]"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus size={32} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">관심 후보자를 팔로우하세요</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    후보자를 팔로우하면 관련 뉴스를<br />
                    모아서 볼 수 있어요
                  </p>
                  <button
                    onClick={() => navigate('/election')}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium"
                  >
                    후보자 둘러보기
                  </button>
                </motion.div>
              ) : personalizedNews.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Newspaper size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">관련 뉴스가 없습니다</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {personalizedNews.map((article, index) => (
                    <NewsCard key={article.id} article={article} index={index} />
                  ))}
                </motion.div>
              )}
            </TabsContent>

            {/* All News Feed */}
            <TabsContent value="all" className="mt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {allNews.map((article, index) => (
                  <NewsCard key={article.id} article={article} index={index} />
                ))}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </motion.div>
  );
}
