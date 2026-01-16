import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Pencil, Trash2, Search, 
  ChevronDown, ChevronUp, Users, Save, X,
  Loader2, Filter
} from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';
import { 
  useAllPolicyCardsAdmin, 
  useCreatePolicyCard, 
  useUpdatePolicyCard, 
  useDeletePolicyCard,
  useSavePolicyAlignment,
  useDeletePolicyAlignment,
} from '@/hooks/usePolicyCards';
import { useCandidates } from '@/hooks/useCandidates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const POLICY_CATEGORIES = ['주거', '교통', '경제', '복지', '환경', '안전', '도시', '행정'];
const REGIONS = ['전국', '서울특별시', '경기도', '부산광역시', '인천광역시', '대구광역시'];

interface PolicyCardFormData {
  category: string;
  statement: string;
  left_label: string;
  right_label: string;
  region_name: string;
  sort_order: number;
  is_active: boolean;
}

interface AlignmentFormData {
  candidate_id: string;
  stance: 'agree' | 'disagree' | 'neutral';
  intensity: number;
}

export function AdminPolicyCards() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data: policyData, isLoading: cardsLoading } = useAllPolicyCardsAdmin();
  const { data: candidates } = useCandidates();
  
  const createCard = useCreatePolicyCard();
  const updateCard = useUpdatePolicyCard();
  const deleteCard = useDeletePolicyCard();
  const saveAlignment = useSavePolicyAlignment();
  const deleteAlignment = useDeletePolicyAlignment();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  
  // 폼 상태
  const [isCreating, setIsCreating] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PolicyCardFormData>({
    category: '경제',
    statement: '',
    left_label: '반대',
    right_label: '찬성',
    region_name: '전국',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const { cards = [], alignments = [] } = policyData || {};

  // 필터링된 카드
  const filteredCards = cards.filter(card => {
    const matchesSearch = card.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          card.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = filterRegion === 'all' || card.region_name === filterRegion;
    const matchesCategory = filterCategory === 'all' || card.category === filterCategory;
    return matchesSearch && matchesRegion && matchesCategory;
  });

  const handleCreate = async () => {
    if (!formData.statement.trim()) {
      toast.error('정책 문구를 입력해주세요');
      return;
    }

    try {
      await createCard.mutateAsync(formData);
      toast.success('정책 카드가 생성되었습니다');
      setIsCreating(false);
      setFormData({
        category: '경제',
        statement: '',
        left_label: '반대',
        right_label: '찬성',
        region_name: '전국',
        sort_order: 0,
        is_active: true,
      });
    } catch (error) {
      toast.error('정책 카드 생성에 실패했습니다');
    }
  };

  const handleUpdate = async () => {
    if (!editingCardId || !formData.statement.trim()) return;

    try {
      await updateCard.mutateAsync({ id: editingCardId, ...formData });
      toast.success('정책 카드가 수정되었습니다');
      setEditingCardId(null);
    } catch (error) {
      toast.error('정책 카드 수정에 실패했습니다');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteCard.mutateAsync(id);
      toast.success('정책 카드가 삭제되었습니다');
    } catch (error) {
      toast.error('정책 카드 삭제에 실패했습니다');
    }
  };

  const handleEditClick = (card: typeof cards[0]) => {
    setEditingCardId(card.id);
    setFormData({
      category: card.category,
      statement: card.statement,
      left_label: card.left_label,
      right_label: card.right_label,
      region_name: card.region_name,
      sort_order: card.sort_order,
      is_active: card.is_active,
    });
    setIsCreating(false);
  };

  const handleSaveAlignment = async (
    policyCardId: string,
    candidateId: string,
    stance: 'agree' | 'disagree' | 'neutral',
    intensity: number
  ) => {
    try {
      await saveAlignment.mutateAsync({
        policy_card_id: policyCardId,
        candidate_id: candidateId,
        stance,
        intensity,
      });
      toast.success('후보자 입장이 저장되었습니다');
    } catch (error) {
      toast.error('후보자 입장 저장에 실패했습니다');
    }
  };

  const handleRemoveAlignment = async (policyCardId: string, candidateId: string) => {
    try {
      await deleteAlignment.mutateAsync({ policyCardId, candidateId });
      toast.success('후보자 입장이 삭제되었습니다');
    } catch (error) {
      toast.error('후보자 입장 삭제에 실패했습니다');
    }
  };

  const getCardAlignments = (cardId: string) => {
    return alignments.filter(a => a.policy_card_id === cardId);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin/content')} className="p-1 rounded-lg hover:bg-muted">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold text-lg">정책 카드 관리</h1>
          </div>
          <Button onClick={() => { setIsCreating(true); setEditingCardId(null); }} size="sm">
            <Plus size={16} className="mr-1" />
            추가
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="정책 문구 또는 카테고리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="flex-1">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="지역" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 지역</SelectItem>
                {REGIONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {POLICY_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create/Edit Form */}
        <AnimatePresence>
          {(isCreating || editingCardId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl p-4 shadow-app-md border border-border space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {isCreating ? '새 정책 카드' : '정책 카드 수정'}
                </h3>
                <button 
                  onClick={() => { setIsCreating(false); setEditingCardId(null); }}
                  className="p-1 rounded hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>카테고리</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLICY_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>지역</Label>
                  <Select 
                    value={formData.region_name} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, region_name: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>정책 문구</Label>
                <Textarea
                  value={formData.statement}
                  onChange={(e) => setFormData(prev => ({ ...prev, statement: e.target.value }))}
                  placeholder="예: 청년 전용 공공임대주택을 10만 호 이상 공급해야 한다"
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>왼쪽 스와이프 라벨</Label>
                  <Input
                    value={formData.left_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, left_label: e.target.value }))}
                    placeholder="반대"
                  />
                </div>
                <div>
                  <Label>오른쪽 스와이프 라벨</Label>
                  <Input
                    value={formData.right_label}
                    onChange={(e) => setFormData(prev => ({ ...prev, right_label: e.target.value }))}
                    placeholder="찬성"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>정렬 순서</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>활성화</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setIsCreating(false); setEditingCardId(null); }}
                >
                  취소
                </Button>
                <Button 
                  onClick={isCreating ? handleCreate : handleUpdate}
                  disabled={createCard.isPending || updateCard.isPending}
                >
                  {(createCard.isPending || updateCard.isPending) && (
                    <Loader2 size={16} className="mr-1 animate-spin" />
                  )}
                  {isCreating ? '생성' : '저장'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="text-sm text-muted-foreground">
          총 {filteredCards.length}개의 정책 카드
        </div>

        {/* Card List */}
        <div className="space-y-3">
          {filteredCards.map((card) => (
            <PolicyCardItem
              key={card.id}
              card={card}
              alignments={getCardAlignments(card.id)}
              candidates={candidates || []}
              isExpanded={expandedCardId === card.id}
              onToggle={() => setExpandedCardId(prev => prev === card.id ? null : card.id)}
              onEdit={() => handleEditClick(card)}
              onDelete={() => handleDelete(card.id)}
              onSaveAlignment={handleSaveAlignment}
              onRemoveAlignment={handleRemoveAlignment}
            />
          ))}

          {filteredCards.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || filterRegion !== 'all' || filterCategory !== 'all'
                ? '검색 결과가 없습니다'
                : '아직 정책 카드가 없습니다'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// 개별 정책 카드 컴포넌트
interface PolicyCardItemProps {
  card: {
    id: string;
    category: string;
    statement: string;
    left_label: string;
    right_label: string;
    region_name: string;
    is_active: boolean;
  };
  alignments: {
    candidate_id: string;
    stance: string;
    intensity: number;
  }[];
  candidates: { id: string; name: string; party: string }[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveAlignment: (policyId: string, candidateId: string, stance: 'agree' | 'disagree' | 'neutral', intensity: number) => void;
  onRemoveAlignment: (policyId: string, candidateId: string) => void;
}

function PolicyCardItem({
  card,
  alignments,
  candidates,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onSaveAlignment,
  onRemoveAlignment,
}: PolicyCardItemProps) {
  const [editingAlignment, setEditingAlignment] = useState<string | null>(null);
  const [alignmentForm, setAlignmentForm] = useState<AlignmentFormData>({
    candidate_id: '',
    stance: 'neutral',
    intensity: 3,
  });

  const getCandidateById = (id: string) => candidates.find(c => c.id === id);

  const handleAddAlignment = () => {
    if (!alignmentForm.candidate_id) {
      toast.error('후보자를 선택해주세요');
      return;
    }
    onSaveAlignment(card.id, alignmentForm.candidate_id, alignmentForm.stance, alignmentForm.intensity);
    setEditingAlignment(null);
    setAlignmentForm({ candidate_id: '', stance: 'neutral', intensity: 3 });
  };

  return (
    <motion.div
      layout
      className={`bg-card rounded-xl shadow-app-md border overflow-hidden ${
        card.is_active ? 'border-border' : 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
      }`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{card.category}</Badge>
              <Badge variant="secondary">{card.region_name}</Badge>
              {!card.is_active && (
                <Badge variant="destructive" className="text-xs">비활성</Badge>
              )}
            </div>
            <p className="font-medium text-sm leading-relaxed">{card.statement}</p>
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>← {card.left_label}</span>
              <span>{card.right_label} →</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-2 rounded-lg hover:bg-muted">
              <Pencil size={16} />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg hover:bg-muted text-destructive">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Alignments Toggle */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 bg-secondary/50 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          <Users size={14} />
          <span>후보자 입장 ({alignments.length}명)</span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Alignments Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 border-t border-border">
              {/* Existing Alignments */}
              {alignments.map((alignment) => {
                const candidate = getCandidateById(alignment.candidate_id);
                if (!candidate) return null;

                return (
                  <div 
                    key={alignment.candidate_id}
                    className="flex items-center justify-between bg-secondary/30 rounded-lg p-3"
                  >
                    <div>
                      <span className="font-medium text-sm">{candidate.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{candidate.party}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        alignment.stance === 'agree' ? 'default' :
                        alignment.stance === 'disagree' ? 'destructive' : 'secondary'
                      }>
                        {alignment.stance === 'agree' ? '찬성' : 
                         alignment.stance === 'disagree' ? '반대' : '중립'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        강도: {alignment.intensity}
                      </span>
                      <button 
                        onClick={() => onRemoveAlignment(card.id, alignment.candidate_id)}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add Alignment */}
              {editingAlignment === 'new' ? (
                <div className="bg-primary/5 rounded-lg p-3 space-y-3">
                  <Select
                    value={alignmentForm.candidate_id}
                    onValueChange={(v) => setAlignmentForm(prev => ({ ...prev, candidate_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="후보자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates
                        .filter(c => !alignments.some(a => a.candidate_id === c.id))
                        .map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.party})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={alignmentForm.stance}
                      onValueChange={(v: 'agree' | 'disagree' | 'neutral') => 
                        setAlignmentForm(prev => ({ ...prev, stance: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agree">찬성</SelectItem>
                        <SelectItem value="disagree">반대</SelectItem>
                        <SelectItem value="neutral">중립</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={alignmentForm.intensity.toString()}
                      onValueChange={(v) => setAlignmentForm(prev => ({ ...prev, intensity: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="강도" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(i => (
                          <SelectItem key={i} value={i.toString()}>강도 {i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddAlignment}>
                      <Save size={14} className="mr-1" />
                      저장
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingAlignment(null)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setEditingAlignment('new')}
                >
                  <Plus size={14} className="mr-1" />
                  후보자 입장 추가
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
