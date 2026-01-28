import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Users, Newspaper, HelpCircle, Plus, Edit, Trash2, Loader2, ChevronDown, ChevronUp, Settings, Sparkles, Brain, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAdmin } from '@/hooks/useAdmin';
import { useAllCandidatesAdmin, useCreateCandidate, useUpdateCandidate, useDeleteCandidate, type DBCandidate } from '@/hooks/useCandidates';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PledgeCareerManager } from '@/components/admin/PledgeCareerManager';
import { CandidateImageUpload } from '@/components/admin/CandidateImageUpload';
import { NewsArticleDialog } from '@/components/admin/NewsArticleDialog';

type ContentTab = 'candidates' | 'news' | 'quiz';

export function AdminContent() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<ContentTab>('candidates');
  const [expandedSection, setExpandedSection] = useState<ContentTab | null>('candidates');

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/admin')} className="p-1 rounded-lg hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <FileText size={22} className="text-primary" />
          <h1 className="font-semibold text-lg">콘텐츠 관리</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-20">
        {/* Candidates Section */}
        <ContentSection
          icon={Users}
          label="후보자 관리"
          color="bg-blue-500"
          isExpanded={expandedSection === 'candidates'}
          onToggle={() => setExpandedSection(expandedSection === 'candidates' ? null : 'candidates')}
        >
          <CandidatesManager />
        </ContentSection>

        {/* News Section */}
        <ContentSection
          icon={Newspaper}
          label="뉴스 관리"
          color="bg-green-500"
          isExpanded={expandedSection === 'news'}
          onToggle={() => setExpandedSection(expandedSection === 'news' ? null : 'news')}
        >
          <NewsManager />
        </ContentSection>

        {/* Policy Cards Section */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/admin/policy-cards')}
          className="w-full bg-card rounded-xl shadow-app-md p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="text-left">
              <span className="font-medium block">정책 매칭 카드 관리</span>
              <span className="text-xs text-muted-foreground">정책 질문 및 후보자 입장 설정</span>
            </div>
          </div>
          <ChevronDown size={20} className="rotate-[-90deg]" />
        </motion.button>

        {/* Political MBTI Section */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/admin/mbti')}
          className="w-full bg-card rounded-xl shadow-app-md p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div className="text-left">
              <span className="font-medium block">정치 MBTI 관리</span>
              <span className="text-xs text-muted-foreground">질문, 유형, 결과 통계 관리</span>
            </div>
          </div>
          <ChevronDown size={20} className="rotate-[-90deg]" />
        </motion.button>

        {/* Quiz Section */}
        <ContentSection
          icon={HelpCircle}
          label="퀴즈 관리"
          color="bg-purple-500"
          isExpanded={expandedSection === 'quiz'}
          onToggle={() => setExpandedSection(expandedSection === 'quiz' ? null : 'quiz')}
        >
          <QuizManager />
        </ContentSection>
      </main>
    </div>
  );
}

interface ContentSectionProps {
  icon: React.ElementType;
  label: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ContentSection({ icon: Icon, label, color, isExpanded, onToggle, children }: ContentSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-app-md overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon size={20} className="text-white" />
          </div>
          <span className="font-medium">{label}</span>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

// Candidates Manager
function CandidatesManager() {
  const navigate = useNavigate();
  const { data: candidates, isLoading } = useAllCandidatesAdmin();
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const deleteCandidate = useDeleteCandidate();
  const [editingCandidate, setEditingCandidate] = useState<DBCandidate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [managingPledgesFor, setManagingPledgesFor] = useState<DBCandidate | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 후보자를 삭제하시겠습니까?`)) return;
    try {
      await deleteCandidate.mutateAsync(id);
      toast.success('후보자가 삭제되었습니다');
    } catch (error) {
      toast.error('삭제 실패');
    }
  };

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1 flex-1">
          <Plus size={16} /> 후보자 추가
        </Button>
        <Button 
          onClick={() => navigate('/admin/candidate-import')} 
          size="sm" 
          variant="outline"
          className="gap-1 flex-1"
        >
          <Wand2 size={16} /> AI 자동 추출
        </Button>
      </div>

      {candidates?.map(candidate => (
        <div key={candidate.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          {candidate.image_url ? (
            <img 
              src={candidate.image_url} 
              alt={candidate.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: candidate.party_color }}
            >
              {candidate.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{candidate.name}</p>
            <p className="text-xs text-muted-foreground truncate">{candidate.party} · {candidate.region_name}</p>
          </div>
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setManagingPledgesFor(candidate)}
              title="공약/경력 관리"
            >
              <Settings size={16} className="text-primary" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setEditingCandidate(candidate)}>
              <Edit size={16} />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => handleDelete(candidate.id, candidate.name)}>
              <Trash2 size={16} className="text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <CandidateDialog
        candidate={editingCandidate}
        isOpen={!!editingCandidate || isCreateOpen}
        onClose={() => { setEditingCandidate(null); setIsCreateOpen(false); }}
        onSave={async (data) => {
          try {
            if (editingCandidate) {
              await updateCandidate.mutateAsync({ id: editingCandidate.id, ...data });
              toast.success('수정되었습니다');
            } else {
              await createCandidate.mutateAsync(data as any);
              toast.success('추가되었습니다');
            }
            setEditingCandidate(null);
            setIsCreateOpen(false);
          } catch (error) {
            toast.error('저장 실패');
          }
        }}
      />

      {managingPledgesFor && (
        <PledgeCareerManager
          candidateId={managingPledgesFor.id}
          candidateName={managingPledgesFor.name}
          isOpen={!!managingPledgesFor}
          onClose={() => setManagingPledgesFor(null)}
        />
      )}
    </div>
  );
}

interface CandidateDialogProps {
  candidate: DBCandidate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<DBCandidate>) => void;
}

function CandidateDialog({ candidate, isOpen, onClose, onSave }: CandidateDialogProps) {
  const [form, setForm] = useState({
    slug: '',
    name: '',
    party: '',
    party_color: '#808080',
    summary: '',
    position: '',
    region_name: '서울특별시',
    sort_order: 0,
    image_url: null as string | null,
  });

  useEffect(() => {
    if (candidate) {
      setForm({
        slug: candidate.slug,
        name: candidate.name,
        party: candidate.party,
        party_color: candidate.party_color,
        summary: candidate.summary,
        position: candidate.position,
        region_name: candidate.region_name,
        sort_order: candidate.sort_order,
        image_url: candidate.image_url,
      });
    } else {
      setForm({
        slug: '',
        name: '',
        party: '',
        party_color: '#808080',
        summary: '',
        position: '',
        region_name: '서울특별시',
        sort_order: 0,
        image_url: null,
      });
    }
  }, [candidate, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{candidate ? '후보자 수정' : '후보자 추가'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {candidate && (
            <CandidateImageUpload
              candidateId={candidate.id}
              currentImageUrl={form.image_url}
              onImageUploaded={(url) => setForm(f => ({ ...f, image_url: url || null }))}
            />
          )}
          <Input placeholder="슬러그 (예: seoul-1)" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          <Input placeholder="이름" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="정당" value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))} />
          <div className="flex gap-2">
            <Input type="color" value={form.party_color} onChange={e => setForm(f => ({ ...f, party_color: e.target.value }))} className="w-16" />
            <Input placeholder="정당 색상" value={form.party_color} onChange={e => setForm(f => ({ ...f, party_color: e.target.value }))} />
          </div>
          <Input placeholder="직위 (예: 서울시장 예비후보)" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
          <Input placeholder="지역 (예: 서울특별시)" value={form.region_name} onChange={e => setForm(f => ({ ...f, region_name: e.target.value }))} />
          <Textarea placeholder="요약" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} />
          <Input type="number" placeholder="정렬 순서" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={() => onSave(form)}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// News Manager
function NewsManager() {
  const queryClient = useQueryClient();
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: candidates } = useAllCandidatesAdmin();

  const { data: news, isLoading } = useQuery({
    queryKey: ['news-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('news_articles').select('*').order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createNews = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('news_articles').insert(data);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news-admin'] }),
  });

  const updateNews = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from('news_articles').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news-admin'] }),
  });

  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('news_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news-admin'] }),
  });

  const handleSave = async (data: any) => {
    try {
      if (editingArticle) {
        await updateNews.mutateAsync({ id: editingArticle.id, ...data });
        toast.success('수정되었습니다');
      } else {
        await createNews.mutateAsync(data);
        toast.success('추가되었습니다');
      }
      setEditingArticle(null);
      setIsCreateOpen(false);
    } catch (error) {
      toast.error('저장 실패');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 뉴스를 삭제하시겠습니까?`)) return;
    try {
      await deleteNews.mutateAsync(id);
      toast.success('삭제되었습니다');
    } catch { toast.error('삭제 실패'); }
  };

  const getCandidateName = (candidateSlug: string | null) => {
    if (!candidateSlug || !candidates) return null;
    const candidate = candidates.find(c => c.slug === candidateSlug);
    return candidate ? candidate.name : candidateSlug;
  };

  if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{news?.length || 0}개의 뉴스</p>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1">
          <Plus size={16} /> 뉴스 추가
        </Button>
      </div>

      {news?.slice(0, 20).map(article => (
        <div key={article.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{article.title}</p>
            <p className="text-xs text-muted-foreground">
              {article.source} · {new Date(article.published_at).toLocaleDateString('ko-KR')}
              {article.candidate_id && (
                <span className="ml-1 text-primary">· {getCandidateName(article.candidate_id)}</span>
              )}
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => setEditingArticle(article)}>
              <Edit size={16} />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => handleDelete(article.id, article.title)}>
              <Trash2 size={16} className="text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <NewsArticleDialog
        article={editingArticle}
        isOpen={!!editingArticle || isCreateOpen}
        onClose={() => { setEditingArticle(null); setIsCreateOpen(false); }}
        onSave={handleSave}
        isSaving={createNews.isPending || updateNews.isPending}
      />
    </div>
  );
}

// Quiz Manager
function QuizManager() {
  const queryClient = useQueryClient();
  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.from('quiz_questions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quiz-admin'] }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('quiz_questions').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quiz-admin'] }),
  });

  if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground">{questions?.length || 0}개의 퀴즈</p>
      {questions?.map(q => (
        <div key={q.id} className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{q.question}</p>
              <p className="text-xs text-muted-foreground">{q.category} · {q.difficulty} · {q.points}점</p>
            </div>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant={q.is_active ? "default" : "outline"}
                onClick={() => toggleActive.mutate({ id: q.id, is_active: !q.is_active })}
              >
                {q.is_active ? '활성' : '비활성'}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => deleteQuestion.mutate(q.id)}>
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
