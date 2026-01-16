import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Share2, Briefcase, FileText, GraduationCap, Calendar, Building2, Newspaper, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NewsCard } from '@/components/news/NewsCard';
import { useCandidateBySlug } from '@/hooks/useCandidates';
import { useNewsForCandidate } from '@/hooks/useNews';

export function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch candidate from DB
  const { data: candidate, isLoading: isCandidateLoading } = useCandidateBySlug(id || '');
  
  // Fetch news from DB
  const { data: news, isLoading: isNewsLoading } = useNewsForCandidate(id || '');

  // URL 파라미터 변경 시 탭 동기화
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'pledges', 'career', 'news'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  if (isCandidateLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">후보자를 찾을 수 없습니다</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary font-medium"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-24 lg:pb-8"
    >
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold">후보자 정보</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Profile Hero */}
      <section className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl p-6 shadow-[var(--shadow-md)]"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${candidate.partyColor}40, ${candidate.partyColor}20)`,
                border: `3px solid ${candidate.partyColor}`,
              }}
            >
              {candidate.image ? (
                <img
                  src={candidate.image}
                  alt={candidate.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={48} style={{ color: candidate.partyColor }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <h2 className="text-2xl font-bold">{candidate.name}</h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${candidate.partyColor}20`,
                    color: candidate.partyColor,
                  }}
                >
                  {candidate.party}
                </span>
              </div>
              <p className="text-muted-foreground mb-2">{candidate.position}</p>
              {candidate.slogan && (
                <p className="text-primary font-medium italic">"{candidate.slogan}"</p>
              )}

              {/* Quick Stats */}
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                {candidate.age && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {candidate.age}세
                  </span>
                )}
                {candidate.education && (
                  <span className="flex items-center gap-1">
                    <GraduationCap size={14} />
                    {candidate.education.split(',')[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Tabs Section */}
      <section className="px-4 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs sm:text-sm">
              <User size={14} />
              <span className="hidden sm:inline">프로필</span>
            </TabsTrigger>
            <TabsTrigger value="pledges" className="flex items-center gap-1 text-xs sm:text-sm">
              <FileText size={14} />
              <span className="hidden sm:inline">공약</span>
            </TabsTrigger>
            <TabsTrigger value="career" className="flex items-center gap-1 text-xs sm:text-sm">
              <Briefcase size={14} />
              <span className="hidden sm:inline">경력</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-1 text-xs sm:text-sm">
              <Newspaper size={14} />
              <span className="hidden sm:inline">뉴스</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User size={18} className="text-primary" />
                    기본 정보
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">이름</span>
                      <span className="font-medium">{candidate.name}</span>
                    </div>
                    {candidate.age && (
                      <div className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">나이</span>
                        <span className="font-medium">{candidate.age}세</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground">소속</span>
                      <span className="font-medium" style={{ color: candidate.partyColor }}>{candidate.party}</span>
                    </div>
                    {candidate.education && (
                      <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">학력</span>
                        <span className="font-medium text-right max-w-[60%]">{candidate.education}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]">
                  <h3 className="font-semibold mb-3">한 줄 소개</h3>
                  <p className="text-secondary-foreground">{candidate.summary}</p>
                </div>
              </motion.div>
            </TabsContent>

            {/* Pledges Tab */}
            <TabsContent value="pledges" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {candidate.pledges && candidate.pledges.length > 0 ? (
                  candidate.pledges.map((pledge, index) => (
                    <motion.div
                      key={pledge.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                          style={{
                            backgroundColor: `${candidate.partyColor}20`,
                            color: candidate.partyColor,
                          }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{pledge.title}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {pledge.category}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-foreground">
                            {pledge.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>등록된 공약이 없습니다</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* Career Tab */}
            <TabsContent value="career" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl p-5 shadow-[var(--shadow-sm)]"
              >
                {candidate.careers && candidate.careers.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

                    <div className="space-y-6">
                      {candidate.careers.map((career, index) => (
                        <motion.div
                          key={career.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-10"
                        >
                          {/* Timeline dot */}
                          <div
                            className="absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: index === 0 ? candidate.partyColor : 'hsl(var(--secondary))',
                            }}
                          >
                            <Building2 size={12} className={index === 0 ? 'text-white' : 'text-muted-foreground'} />
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{career.period}</p>
                            <h4 className="font-semibold text-sm">{career.title}</h4>
                            <p className="text-sm text-secondary-foreground">{career.organization}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
                    <p>등록된 경력이 없습니다</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            {/* News Tab */}
            <TabsContent value="news" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {isNewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-muted-foreground" size={24} />
                  </div>
                ) : news && news.length > 0 ? (
                  news.map((article, index) => (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      index={index}
                      showCandidate={false}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
                    <p>관련 뉴스가 없습니다</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </section>

      {/* Share Button */}
      <section className="fixed bottom-20 lg:bottom-8 left-0 right-0 px-4 lg:px-8">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white shadow-lg"
          style={{ backgroundColor: candidate.partyColor }}
        >
          <Share2 size={18} />
          후보자 정보 공유하기
        </motion.button>
      </section>
    </motion.div>
  );
}
