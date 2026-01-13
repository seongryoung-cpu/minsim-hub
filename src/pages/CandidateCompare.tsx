import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Check, X, Scale, FileText, Briefcase, Calendar, Building2, Loader2 } from 'lucide-react';
import type { Candidate } from '@/types/election';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCandidates } from '@/hooks/useCandidates';

export function CandidateCompare() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'pledges' | 'careers'>('pledges');

  // Fetch all candidates from DB
  const { data: allCandidates = [], isLoading } = useCandidates();

  // Group candidates by region
  const candidatesByRegion = useMemo(() => {
    const grouped: Record<string, Candidate[]> = {};
    allCandidates.forEach(c => {
      const region = c.position || '기타';
      if (!grouped[region]) grouped[region] = [];
      grouped[region].push(c);
    });
    return grouped;
  }, [allCandidates]);

  const selectedCandidates = useMemo(() => {
    return selectedIds.map(id => allCandidates.find(c => c.id === id)).filter(Boolean) as Candidate[];
  }, [selectedIds, allCandidates]);

  const toggleCandidate = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Get all unique pledge categories
  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    selectedCandidates.forEach(c => {
      c.pledges?.forEach(p => categories.add(p.category));
    });
    return Array.from(categories);
  }, [selectedCandidates]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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
              <Scale size={20} className="text-primary" />
              <h1 className="font-semibold text-lg">후보자 비교</h1>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              선택 초기화
            </button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Selection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">비교할 후보자 선택</h2>
            <span className="text-sm text-muted-foreground">
              {selectedIds.length}/4명 선택됨
            </span>
          </div>

          {/* Candidates grouped by position */}
          {Object.entries(candidatesByRegion).map(([position, candidates]) => (
            <div key={position} className="mb-4 last:mb-0">
              <p className="text-xs text-muted-foreground mb-2">{position}</p>
              <div className="flex flex-wrap gap-2">
                {candidates.map(candidate => {
                  const isSelected = selectedIds.includes(candidate.id);
                  const isDisabled = !isSelected && selectedIds.length >= 4;
                  return (
                    <motion.button
                      key={candidate.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => !isDisabled && toggleCandidate(candidate.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-offset-background'
                          : isDisabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-secondary'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${candidate.partyColor}15` : undefined,
                        borderColor: isSelected ? candidate.partyColor : undefined,
                        ['--tw-ring-color' as string]: candidate.partyColor,
                      }}
                    >
                      {candidate.image ? (
                        <img 
                          src={candidate.image} 
                          alt={candidate.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{
                            backgroundColor: `${candidate.partyColor}20`,
                            color: candidate.partyColor,
                          }}
                        >
                          {candidate.name[0]}
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium">{candidate.name}</p>
                        <p className="text-[10px] text-muted-foreground">{candidate.party}</p>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-primary ml-1" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {allCandidates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>등록된 후보자가 없습니다</p>
            </div>
          )}
        </motion.div>

        {/* Comparison Section */}
        <AnimatePresence mode="wait">
          {selectedCandidates.length >= 2 ? (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Candidate Headers - Sticky */}
              <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-md)] sticky top-16 z-10">
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
                  {selectedCandidates.map((candidate, index) => (
                    <motion.div
                      key={candidate.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center"
                    >
                      {candidate.image ? (
                        <img
                          src={candidate.image}
                          alt={candidate.name}
                          className="w-14 h-14 mx-auto rounded-full object-cover mb-2"
                          style={{ border: `2px solid ${candidate.partyColor}` }}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2"
                          style={{
                            background: `linear-gradient(135deg, ${candidate.partyColor}40, ${candidate.partyColor}20)`,
                            border: `2px solid ${candidate.partyColor}`,
                          }}
                        >
                          <User size={24} style={{ color: candidate.partyColor }} />
                        </div>
                      )}
                      <p className="font-semibold text-sm">{candidate.name}</p>
                      <p
                        className="text-[10px] px-2 py-0.5 rounded-full inline-block mt-1"
                        style={{
                          backgroundColor: `${candidate.partyColor}15`,
                          color: candidate.partyColor,
                        }}
                      >
                        {candidate.party}
                      </p>
                      <button
                        onClick={() => toggleCandidate(candidate.id)}
                        className="block mx-auto mt-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <X size={14} className="inline" /> 제외
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Basic Info Comparison */}
              <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  기본 정보
                </h3>
                <div className="space-y-3">
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
                    {selectedCandidates.map(c => (
                      <div key={c.id} className="text-center p-2 bg-secondary/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground mb-1">나이</p>
                        <p className="font-semibold">{c.age}세</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}>
                    {selectedCandidates.map(c => (
                      <div key={c.id} className="text-center p-2 bg-secondary/30 rounded-xl">
                        <p className="text-[10px] text-muted-foreground mb-1">학력</p>
                        <p className="text-xs font-medium line-clamp-2">{c.education?.split(',')[0]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs for Pledges/Careers */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pledges' | 'careers')}>
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="pledges" className="flex items-center gap-2">
                    <FileText size={16} />
                    공약 비교
                  </TabsTrigger>
                  <TabsTrigger value="careers" className="flex items-center gap-2">
                    <Briefcase size={16} />
                    경력 비교
                  </TabsTrigger>
                </TabsList>

                {/* Pledges Comparison - Table Style */}
                <TabsContent value="pledges" className="space-y-4">
                  {/* Category Pills for Quick Nav */}
                  {allCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {allCategories.map(category => (
                        <button
                          key={category}
                          onClick={() => {
                            document.getElementById(`category-${category}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Category Comparison Cards */}
                  {allCategories.map((category, catIndex) => (
                    <motion.div
                      key={category}
                      id={`category-${category}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIndex * 0.05 }}
                      className="bg-card rounded-2xl shadow-[var(--shadow-md)] overflow-hidden"
                    >
                      {/* Category Header */}
                      <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-primary" />
                          <h4 className="font-bold text-base">{category}</h4>
                        </div>
                      </div>

                      {/* Comparison Table */}
                      <div className="overflow-x-auto">
                        <div 
                          className="grid min-w-[600px]"
                          style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}
                        >
                          {selectedCandidates.map((candidate, idx) => {
                            const pledge = candidate.pledges?.find(p => p.category === category);
                            return (
                              <div 
                                key={candidate.id}
                                className={`p-4 ${idx !== selectedCandidates.length - 1 ? 'border-r border-border/50' : ''}`}
                              >
                                {/* Candidate Name Header */}
                                <div 
                                  className="flex items-center gap-2 mb-3 pb-2 border-b"
                                  style={{ borderColor: `${candidate.partyColor}30` }}
                                >
                                  <div 
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ 
                                      backgroundColor: `${candidate.partyColor}20`,
                                      color: candidate.partyColor 
                                    }}
                                  >
                                    {candidate.name[0]}
                                  </div>
                                  <span className="font-semibold text-sm">{candidate.name}</span>
                                </div>

                                {pledge ? (
                                  <div className="space-y-2">
                                    <h5 
                                      className="font-bold text-sm"
                                      style={{ color: candidate.partyColor }}
                                    >
                                      {pledge.title}
                                    </h5>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {pledge.description}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                                    <div className="text-center">
                                      <X size={20} className="mx-auto mb-1 opacity-40" />
                                      <p className="text-xs">공약 없음</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {allCategories.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl">
                      <FileText size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-medium">공약 정보가 없습니다</p>
                      <p className="text-sm mt-1">후보자의 상세 페이지에서 확인해주세요</p>
                    </div>
                  )}
                </TabsContent>

                {/* Careers Comparison - Timeline Style */}
                <TabsContent value="careers" className="space-y-3">
                  <div className="bg-card rounded-2xl p-4 shadow-[var(--shadow-sm)]">
                    <div 
                      className="grid gap-4"
                      style={{ gridTemplateColumns: `repeat(${selectedCandidates.length}, 1fr)` }}
                    >
                      {selectedCandidates.map((candidate, candidateIdx) => (
                        <div key={candidate.id} className="relative">
                          {/* Candidate Header */}
                          <div 
                            className="text-center py-3 rounded-xl mb-4 relative overflow-hidden"
                            style={{ backgroundColor: `${candidate.partyColor}15` }}
                          >
                            <div 
                              className="absolute inset-0 opacity-10"
                              style={{ 
                                background: `linear-gradient(135deg, ${candidate.partyColor} 0%, transparent 60%)` 
                              }}
                            />
                            <div className="relative">
                              {candidate.image ? (
                                <img
                                  src={candidate.image}
                                  alt={candidate.name}
                                  className="w-10 h-10 mx-auto rounded-full object-cover mb-2"
                                  style={{ border: `2px solid ${candidate.partyColor}` }}
                                />
                              ) : (
                                <div
                                  className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2"
                                  style={{
                                    background: `linear-gradient(135deg, ${candidate.partyColor}40, ${candidate.partyColor}20)`,
                                    border: `2px solid ${candidate.partyColor}`,
                                  }}
                                >
                                  <User size={18} style={{ color: candidate.partyColor }} />
                                </div>
                              )}
                              <p className="text-sm font-bold" style={{ color: candidate.partyColor }}>
                                {candidate.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{candidate.party}</p>
                            </div>
                          </div>

                          {/* Timeline */}
                          <div className="relative">
                            {/* Vertical Timeline Line */}
                            <div 
                              className="absolute left-3 top-2 bottom-2 w-0.5 rounded-full"
                              style={{ backgroundColor: `${candidate.partyColor}30` }}
                            />
                            
                            <div className="space-y-4">
                              {candidate.careers?.map((career, idx) => (
                                <motion.div
                                  key={career.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: candidateIdx * 0.1 + idx * 0.15 }}
                                  className="relative pl-8"
                                >
                                  {/* Timeline Dot */}
                                  <div 
                                    className="absolute left-1 top-1 w-4 h-4 rounded-full flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: candidate.partyColor,
                                      boxShadow: `0 0 0 3px ${candidate.partyColor}20`
                                    }}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>

                                  {/* Career Card */}
                                  <div 
                                    className="bg-secondary/50 rounded-xl p-3 hover:bg-secondary/80 transition-colors"
                                  >
                                    {/* Period Badge */}
                                    <div 
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-2"
                                      style={{ 
                                        backgroundColor: `${candidate.partyColor}20`,
                                        color: candidate.partyColor 
                                      }}
                                    >
                                      <Calendar size={10} />
                                      {career.period}
                                    </div>

                                    {/* Title */}
                                    <p className="text-sm font-semibold text-foreground leading-tight mb-1">
                                      {career.title}
                                    </p>

                                    {/* Organization */}
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Building2 size={12} className="flex-shrink-0" />
                                      <span>{career.organization}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}

                              {(!candidate.careers || candidate.careers.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Briefcase size={24} className="mx-auto mb-2 opacity-30" />
                                  <p className="text-xs">경력 정보 없음</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card rounded-2xl p-8 text-center shadow-[var(--shadow-md)]"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Scale size={32} className="text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">후보자를 선택하세요</h3>
              <p className="text-muted-foreground text-sm">
                비교하고 싶은 후보자를<br />
                2~3명 선택해주세요
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
