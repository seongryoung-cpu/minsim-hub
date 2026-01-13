import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Briefcase, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Pledge {
  id: string;
  candidate_id: string;
  title: string;
  description: string;
  category: string;
  sort_order: number;
}

interface Career {
  id: string;
  candidate_id: string;
  period: string;
  title: string;
  organization: string;
  sort_order: number;
}

interface PledgeCareerManagerProps {
  candidateId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PledgeCareerManager({ candidateId, candidateName, isOpen, onClose }: PledgeCareerManagerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pledges' | 'careers'>('pledges');

  // Fetch pledges
  const { data: pledges, isLoading: pledgesLoading } = useQuery({
    queryKey: ['pledges-admin', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_pledges')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Pledge[];
    },
    enabled: isOpen,
  });

  // Fetch careers
  const { data: careers, isLoading: careersLoading } = useQuery({
    queryKey: ['careers-admin', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_careers')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as Career[];
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{candidateName}</span>
            <span className="text-muted-foreground font-normal">공약 & 경력 관리</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pledges' | 'careers')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pledges" className="gap-2">
              <FileText size={16} />
              공약 ({pledges?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="careers" className="gap-2">
              <Briefcase size={16} />
              경력 ({careers?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pledges" className="flex-1 overflow-auto mt-4">
            {pledgesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <PledgesTab 
                pledges={pledges || []} 
                candidateId={candidateId} 
                queryClient={queryClient} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="careers" className="flex-1 overflow-auto mt-4">
            {careersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <CareersTab 
                careers={careers || []} 
                candidateId={candidateId} 
                queryClient={queryClient} 
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Pledges Tab
interface PledgesTabProps {
  pledges: Pledge[];
  candidateId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}

function PledgesTab({ pledges, candidateId, queryClient }: PledgesTabProps) {
  const [editingPledge, setEditingPledge] = useState<Pledge | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createPledge = useMutation({
    mutationFn: async (data: Omit<Pledge, 'id'>) => {
      const { error } = await supabase.from('candidate_pledges').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges-admin', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });

  const updatePledge = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Pledge> & { id: string }) => {
      const { error } = await supabase.from('candidate_pledges').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges-admin', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });

  const deletePledge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('candidate_pledges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges-admin', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 공약을 삭제하시겠습니까?`)) return;
    try {
      await deletePledge.mutateAsync(id);
      toast.success('삭제되었습니다');
    } catch {
      toast.error('삭제 실패');
    }
  };

  const handleSave = async (data: Omit<Pledge, 'id'>) => {
    try {
      if (editingPledge) {
        await updatePledge.mutateAsync({ id: editingPledge.id, ...data });
        toast.success('수정되었습니다');
      } else {
        await createPledge.mutateAsync(data);
        toast.success('추가되었습니다');
      }
      setEditingPledge(null);
      setIsCreateOpen(false);
    } catch {
      toast.error('저장 실패');
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1 w-full">
        <Plus size={16} /> 공약 추가
      </Button>

      {pledges.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">등록된 공약이 없습니다</p>
      ) : (
        pledges.map((pledge, index) => (
          <div key={pledge.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-muted-foreground mt-1">
              <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{pledge.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{pledge.description}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                {pledge.category}
              </span>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditingPledge(pledge)}>
                <Edit size={16} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(pledge.id, pledge.title)}>
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}

      <PledgeDialog
        pledge={editingPledge}
        candidateId={candidateId}
        nextSortOrder={pledges.length}
        isOpen={!!editingPledge || isCreateOpen}
        onClose={() => { setEditingPledge(null); setIsCreateOpen(false); }}
        onSave={handleSave}
      />
    </div>
  );
}

// Pledge Dialog
interface PledgeDialogProps {
  pledge: Pledge | null;
  candidateId: string;
  nextSortOrder: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Pledge, 'id'>) => void;
}

function PledgeDialog({ pledge, candidateId, nextSortOrder, isOpen, onClose, onSave }: PledgeDialogProps) {
  const [form, setForm] = useState({
    title: pledge?.title || '',
    description: pledge?.description || '',
    category: pledge?.category || '경제',
    sort_order: pledge?.sort_order ?? nextSortOrder,
  });

  // Reset form when pledge changes
  useState(() => {
    if (pledge) {
      setForm({
        title: pledge.title,
        description: pledge.description,
        category: pledge.category,
        sort_order: pledge.sort_order,
      });
    } else {
      setForm({
        title: '',
        description: '',
        category: '경제',
        sort_order: nextSortOrder,
      });
    }
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    onSave({
      candidate_id: candidateId,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      sort_order: form.sort_order,
    });
  };

  const categories = ['경제', '복지', '환경', '교육', '안전', '교통', '주거', '문화', '기타'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{pledge ? '공약 수정' : '공약 추가'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input 
            placeholder="공약 제목" 
            value={form.title} 
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
          />
          <Textarea 
            placeholder="공약 설명" 
            rows={4}
            value={form.description} 
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
          />
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={form.category === cat ? 'default' : 'outline'}
                  onClick={() => setForm(f => ({ ...f, category: cat }))}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <Input 
            type="number" 
            placeholder="정렬 순서" 
            value={form.sort_order} 
            onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} 
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Careers Tab
interface CareersTabProps {
  careers: Career[];
  candidateId: string;
  queryClient: ReturnType<typeof useQueryClient>;
}

function CareersTab({ careers, candidateId, queryClient }: CareersTabProps) {
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const createCareer = useMutation({
    mutationFn: async (data: Omit<Career, 'id'>) => {
      const { error } = await supabase.from('candidate_careers').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers-admin', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });

  const updateCareer = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Career> & { id: string }) => {
      const { error } = await supabase.from('candidate_careers').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers-admin', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });

  const deleteCareer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('candidate_careers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers-admin', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 경력을 삭제하시겠습니까?`)) return;
    try {
      await deleteCareer.mutateAsync(id);
      toast.success('삭제되었습니다');
    } catch {
      toast.error('삭제 실패');
    }
  };

  const handleSave = async (data: Omit<Career, 'id'>) => {
    try {
      if (editingCareer) {
        await updateCareer.mutateAsync({ id: editingCareer.id, ...data });
        toast.success('수정되었습니다');
      } else {
        await createCareer.mutateAsync(data);
        toast.success('추가되었습니다');
      }
      setEditingCareer(null);
      setIsCreateOpen(false);
    } catch {
      toast.error('저장 실패');
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1 w-full">
        <Plus size={16} /> 경력 추가
      </Button>

      {careers.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">등록된 경력이 없습니다</p>
      ) : (
        careers.map((career) => (
          <div key={career.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-muted-foreground mt-1">
              <GripVertical size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{career.title}</p>
              <p className="text-xs text-muted-foreground">{career.organization}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {career.period}
              </span>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditingCareer(career)}>
                <Edit size={16} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(career.id, career.title)}>
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}

      <CareerDialog
        career={editingCareer}
        candidateId={candidateId}
        nextSortOrder={careers.length}
        isOpen={!!editingCareer || isCreateOpen}
        onClose={() => { setEditingCareer(null); setIsCreateOpen(false); }}
        onSave={handleSave}
      />
    </div>
  );
}

// Career Dialog
interface CareerDialogProps {
  career: Career | null;
  candidateId: string;
  nextSortOrder: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Career, 'id'>) => void;
}

function CareerDialog({ career, candidateId, nextSortOrder, isOpen, onClose, onSave }: CareerDialogProps) {
  const [form, setForm] = useState({
    period: career?.period || '',
    title: career?.title || '',
    organization: career?.organization || '',
    sort_order: career?.sort_order ?? nextSortOrder,
  });

  // Reset form when career changes
  useState(() => {
    if (career) {
      setForm({
        period: career.period,
        title: career.title,
        organization: career.organization,
        sort_order: career.sort_order,
      });
    } else {
      setForm({
        period: '',
        title: '',
        organization: '',
        sort_order: nextSortOrder,
      });
    }
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('직책을 입력해주세요');
      return;
    }
    if (!form.organization.trim()) {
      toast.error('소속을 입력해주세요');
      return;
    }
    onSave({
      candidate_id: candidateId,
      period: form.period.trim(),
      title: form.title.trim(),
      organization: form.organization.trim(),
      sort_order: form.sort_order,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{career ? '경력 수정' : '경력 추가'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input 
            placeholder="기간 (예: 2021-2022)" 
            value={form.period} 
            onChange={e => setForm(f => ({ ...f, period: e.target.value }))} 
          />
          <Input 
            placeholder="직책 (예: 장관)" 
            value={form.title} 
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
          />
          <Input 
            placeholder="소속 (예: 대한민국 정부)" 
            value={form.organization} 
            onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} 
          />
          <Input 
            type="number" 
            placeholder="정렬 순서" 
            value={form.sort_order} 
            onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} 
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSubmit}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
