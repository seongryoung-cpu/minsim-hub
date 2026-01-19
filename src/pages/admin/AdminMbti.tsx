import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, HelpCircle, Loader2, Plus, Edit, Trash2, ChevronDown, ChevronUp, Users, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/hooks/useAdmin';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MbtiQuestion {
  id: string;
  axis: string;
  statement: string;
  left_label: string;
  right_label: string;
  left_axis_value: string;
  right_axis_value: string;
  sort_order: number;
  is_active: boolean;
}

interface MbtiType {
  id: string;
  type_code: string;
  name: string;
  description: string;
  keywords: string[];
  famous_figures: string[];
  strengths: string[];
  weaknesses: string[];
  compatible_types: string[];
  incompatible_types: string[];
  color: string;
  icon: string;
}

interface MbtiResult {
  id: string;
  user_id: string;
  type_code: string;
  created_at: string;
  from_policy_match: boolean;
}

type ExpandedSection = 'questions' | 'types' | 'results' | null;

export function AdminMbti() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('questions');

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
          <Brain size={22} className="text-primary" />
          <h1 className="font-semibold text-lg">정치 MBTI 관리</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-20">
        {/* Questions Section */}
        <ContentSection
          icon={HelpCircle}
          label="질문 관리"
          description="MBTI 테스트 질문 관리"
          color="bg-indigo-500"
          isExpanded={expandedSection === 'questions'}
          onToggle={() => setExpandedSection(expandedSection === 'questions' ? null : 'questions')}
        >
          <QuestionsManager />
        </ContentSection>

        {/* Types Section */}
        <ContentSection
          icon={Brain}
          label="유형 관리"
          description="16가지 정치 성향 유형 관리"
          color="bg-purple-500"
          isExpanded={expandedSection === 'types'}
          onToggle={() => setExpandedSection(expandedSection === 'types' ? null : 'types')}
        >
          <TypesManager />
        </ContentSection>

        {/* Results Section */}
        <ContentSection
          icon={Users}
          label="결과 통계"
          description="사용자 테스트 결과 조회"
          color="bg-emerald-500"
          isExpanded={expandedSection === 'results'}
          onToggle={() => setExpandedSection(expandedSection === 'results' ? null : 'results')}
        >
          <ResultsManager />
        </ContentSection>
      </main>
    </div>
  );
}

interface ContentSectionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ContentSection({ icon: Icon, label, description, color, isExpanded, onToggle, children }: ContentSectionProps) {
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
          <div className="text-left">
            <span className="font-medium block">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
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

// Questions Manager
function QuestionsManager() {
  const queryClient = useQueryClient();
  const [editingQuestion, setEditingQuestion] = useState<MbtiQuestion | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['mbti-questions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('political_mbti_questions')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as MbtiQuestion[];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('political_mbti_questions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mbti-questions-admin'] });
      toast.success('상태가 변경되었습니다');
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('political_mbti_questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mbti-questions-admin'] });
      toast.success('삭제되었습니다');
    },
  });

  const handleDelete = (id: string, statement: string) => {
    if (!confirm(`"${statement.slice(0, 30)}..." 질문을 삭제하시겠습니까?`)) return;
    deleteQuestion.mutate(id);
  };

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const axisLabels: Record<string, string> = {
    EI: '경제 (E/I)',
    SN: '사회 (S/N)',
    TF: '외교 (T/F)',
    JP: '정치 (J/P)',
  };

  return (
    <div className="p-4 space-y-3">
      <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1 w-full">
        <Plus size={16} /> 질문 추가
      </Button>

      <p className="text-xs text-muted-foreground">{questions?.length || 0}개의 질문</p>

      <div className="space-y-2">
        {questions?.map((q, index) => (
          <div key={q.id} className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {axisLabels[q.axis] || q.axis}
                  </span>
                  <span className="text-xs text-muted-foreground">#{q.sort_order}</span>
                </div>
                <p className="text-sm font-medium">{q.statement}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  왼쪽: {q.left_label} ({q.left_axis_value}) | 오른쪽: {q.right_label} ({q.right_axis_value})
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggleActive.mutate({ id: q.id, is_active: !q.is_active })}
                  title={q.is_active ? '비활성화' : '활성화'}
                >
                  {q.is_active ? (
                    <ToggleRight size={18} className="text-green-500" />
                  ) : (
                    <ToggleLeft size={18} className="text-muted-foreground" />
                  )}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingQuestion(q)}>
                  <Edit size={16} />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(q.id, q.statement)}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <QuestionDialog
        question={editingQuestion}
        isOpen={!!editingQuestion || isCreateOpen}
        onClose={() => { setEditingQuestion(null); setIsCreateOpen(false); }}
      />
    </div>
  );
}

interface QuestionDialogProps {
  question: MbtiQuestion | null;
  isOpen: boolean;
  onClose: () => void;
}

function QuestionDialog({ question, isOpen, onClose }: QuestionDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    axis: 'EI',
    statement: '',
    left_label: '',
    right_label: '',
    left_axis_value: '',
    right_axis_value: '',
    sort_order: 0,
    is_active: true,
  });

  useState(() => {
    if (question) {
      setForm({
        axis: question.axis,
        statement: question.statement,
        left_label: question.left_label,
        right_label: question.right_label,
        left_axis_value: question.left_axis_value,
        right_axis_value: question.right_axis_value,
        sort_order: question.sort_order,
        is_active: question.is_active,
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (question) {
        const { error } = await supabase
          .from('political_mbti_questions')
          .update(data)
          .eq('id', question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('political_mbti_questions')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mbti-questions-admin'] });
      toast.success(question ? '수정되었습니다' : '추가되었습니다');
      onClose();
    },
    onError: () => {
      toast.error('저장 실패');
    },
  });

  const handleSubmit = () => {
    if (!form.statement || !form.left_label || !form.right_label) {
      toast.error('필수 항목을 입력하세요');
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? '질문 수정' : '질문 추가'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">축</label>
            <Select value={form.axis} onValueChange={v => setForm(f => ({ ...f, axis: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EI">경제 (E/I)</SelectItem>
                <SelectItem value="SN">사회 (S/N)</SelectItem>
                <SelectItem value="TF">외교 (T/F)</SelectItem>
                <SelectItem value="JP">정치 (J/P)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">질문</label>
            <Textarea 
              placeholder="질문 내용" 
              value={form.statement} 
              onChange={e => setForm(f => ({ ...f, statement: e.target.value }))} 
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">왼쪽 라벨</label>
              <Input 
                placeholder="예: 동의" 
                value={form.left_label} 
                onChange={e => setForm(f => ({ ...f, left_label: e.target.value }))} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">오른쪽 라벨</label>
              <Input 
                placeholder="예: 반대" 
                value={form.right_label} 
                onChange={e => setForm(f => ({ ...f, right_label: e.target.value }))} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">왼쪽 축 값</label>
              <Input 
                placeholder="예: I" 
                value={form.left_axis_value} 
                onChange={e => setForm(f => ({ ...f, left_axis_value: e.target.value }))} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">오른쪽 축 값</label>
              <Input 
                placeholder="예: E" 
                value={form.right_axis_value} 
                onChange={e => setForm(f => ({ ...f, right_axis_value: e.target.value }))} 
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">정렬 순서</label>
            <Input 
              type="number" 
              value={form.sort_order} 
              onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span className="ml-1">저장</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Types Manager
function TypesManager() {
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState<MbtiType | null>(null);

  const { data: types, isLoading } = useQuery({
    queryKey: ['mbti-types-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('political_mbti_types')
        .select('*')
        .order('type_code', { ascending: true });
      if (error) throw error;
      return data as MbtiType[];
    },
  });

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground">{types?.length || 0}개의 유형</p>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">코드</TableHead>
              <TableHead>이름</TableHead>
              <TableHead className="hidden sm:table-cell">키워드</TableHead>
              <TableHead className="w-20">색상</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types?.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-mono font-bold">{t.type_code}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex gap-1 flex-wrap">
                    {t.keywords?.slice(0, 3).map((k, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-secondary rounded">
                        {k}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div 
                    className="w-6 h-6 rounded-full border border-border"
                    style={{ backgroundColor: t.color }}
                  />
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => setEditingType(t)}>
                    <Edit size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingType && (
        <TypeDialog
          type={editingType}
          isOpen={!!editingType}
          onClose={() => setEditingType(null)}
        />
      )}
    </div>
  );
}

interface TypeDialogProps {
  type: MbtiType;
  isOpen: boolean;
  onClose: () => void;
}

function TypeDialog({ type, isOpen, onClose }: TypeDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: type.name,
    description: type.description,
    keywords: type.keywords?.join(', ') || '',
    famous_figures: type.famous_figures?.join(', ') || '',
    strengths: type.strengths?.join(', ') || '',
    weaknesses: type.weaknesses?.join(', ') || '',
    compatible_types: type.compatible_types?.join(', ') || '',
    incompatible_types: type.incompatible_types?.join(', ') || '',
    color: type.color,
    icon: type.icon || 'user',
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('political_mbti_types')
        .update({
          name: form.name,
          description: form.description,
          keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
          famous_figures: form.famous_figures.split(',').map(s => s.trim()).filter(Boolean),
          strengths: form.strengths.split(',').map(s => s.trim()).filter(Boolean),
          weaknesses: form.weaknesses.split(',').map(s => s.trim()).filter(Boolean),
          compatible_types: form.compatible_types.split(',').map(s => s.trim()).filter(Boolean),
          incompatible_types: form.incompatible_types.split(',').map(s => s.trim()).filter(Boolean),
          color: form.color,
          icon: form.icon,
        })
        .eq('id', type.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mbti-types-admin'] });
      toast.success('수정되었습니다');
      onClose();
    },
    onError: () => {
      toast.error('저장 실패');
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>유형 수정: {type.type_code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">이름</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">설명</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div>
            <label className="text-sm font-medium">키워드 (쉼표로 구분)</label>
            <Input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="실용주의, 협력" />
          </div>
          <div>
            <label className="text-sm font-medium">유명 인물 (쉼표로 구분)</label>
            <Input value={form.famous_figures} onChange={e => setForm(f => ({ ...f, famous_figures: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">강점 (쉼표로 구분)</label>
            <Input value={form.strengths} onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">약점 (쉼표로 구분)</label>
            <Input value={form.weaknesses} onChange={e => setForm(f => ({ ...f, weaknesses: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">궁합 좋은 유형</label>
              <Input value={form.compatible_types} onChange={e => setForm(f => ({ ...f, compatible_types: e.target.value }))} placeholder="ESTJ, ENFP" />
            </div>
            <div>
              <label className="text-sm font-medium">궁합 나쁜 유형</label>
              <Input value={form.incompatible_types} onChange={e => setForm(f => ({ ...f, incompatible_types: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">대표 색상</label>
              <div className="flex gap-2">
                <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-16" />
                <Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">아이콘</label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="user" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span className="ml-1">저장</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Results Manager
function ResultsManager() {
  const { data: results, isLoading } = useQuery({
    queryKey: ['mbti-results-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('political_mbti_results')
        .select('id, user_id, type_code, created_at, from_policy_match')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as MbtiResult[];
    },
  });

  const { data: typeStats } = useQuery({
    queryKey: ['mbti-type-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('political_mbti_results')
        .select('type_code');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(r => {
        counts[r.type_code] = (counts[r.type_code] || 0) + 1;
      });
      
      return Object.entries(counts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  if (isLoading) {
    return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Type Distribution */}
      <div>
        <h4 className="text-sm font-medium mb-2">유형별 분포</h4>
        <div className="grid grid-cols-4 gap-2">
          {typeStats?.slice(0, 8).map(stat => (
            <div key={stat.type} className="p-2 bg-muted/50 rounded-lg text-center">
              <span className="font-mono font-bold text-sm">{stat.type}</span>
              <p className="text-xs text-muted-foreground">{stat.count}명</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Results */}
      <div>
        <h4 className="text-sm font-medium mb-2">최근 결과 ({results?.length || 0}건)</h4>
        <div className="space-y-2">
          {results?.slice(0, 10).map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm px-2 py-0.5 bg-primary/10 text-primary rounded">
                  {r.type_code}
                </span>
                {r.from_policy_match && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                    정책매칭
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
