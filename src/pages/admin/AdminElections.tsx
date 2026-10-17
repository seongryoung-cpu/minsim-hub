import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';
import {
  ELECTION_ROLE_LABELS,
  SCHEDULE_KIND_LABELS,
  useElectionAdminMutations,
  useElectionsRaw,
  type ElectionRow,
  type ScheduleItemRow,
  type ScheduleKind,
} from '@/hooks/useElections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const err = (e: unknown) => (e instanceof Error ? e.message : '저장하지 못했어요');

function ElectionEditor({ row }: { row: Partial<ElectionRow> }) {
  const { saveElection, deleteElection } = useElectionAdminMutations();
  const [f, setF] = useState(row);
  const save = () => {
    if (!f.name || !f.election_date) return toast.error('이름과 선거일을 입력해 주세요');
    saveElection.mutate(f as ElectionRow, {
      onSuccess: () => { toast.success('저장했어요'); if (!row.id) setF({ role: 'archived' }); },
      onError: (e) => toast.error(err(e)),
    });
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
      <Input placeholder="이름 (예: 2026 지방선거)" value={f.name ?? ''} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <Input placeholder="정식 명칭" value={f.full_name ?? ''} onChange={(e) => setF({ ...f, full_name: e.target.value })} className="md:col-span-2" />
      <Input type="date" value={f.election_date ?? ''} onChange={(e) => setF({ ...f, election_date: e.target.value })} />
      <Select value={f.role ?? 'archived'} onValueChange={(v) => setF({ ...f, role: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(ELECTION_ROLE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex gap-1">
        <Button size="sm" onClick={save} disabled={saveElection.isPending}>{row.id ? <Save size={14} /> : <Plus size={14} />}</Button>
        {row.id && (
          <Button size="sm" variant="ghost" onClick={() => confirm('이 선거와 일정을 모두 삭제할까요?') && deleteElection.mutate(row.id!)}>
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

function ItemEditor({ row }: { row: Partial<ScheduleItemRow> & { election_id: string; kind: string } }) {
  const { saveItem, deleteItem } = useElectionAdminMutations();
  const [f, setF] = useState(row);
  const isChecklist = f.kind === 'checklist';
  const save = () => {
    if (!f.title) return toast.error('제목을 입력해 주세요');
    saveItem.mutate(
      { ...f, title: f.title, start_date: f.start_date || null, end_date: f.end_date || null, link_url: f.link_url || null, short_label: f.short_label || null },
      {
        onSuccess: () => { toast.success('저장했어요'); if (!row.id) setF({ election_id: row.election_id, kind: row.kind }); },
        onError: (e) => toast.error(err(e)),
      },
    );
  };
  return (
    <div className="grid grid-cols-2 md:grid-cols-8 gap-2 items-center">
      <Input type="number" className="w-full" value={f.sort_order ?? 0} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} />
      <Input placeholder="제목" value={f.title ?? ''} onChange={(e) => setF({ ...f, title: e.target.value })} className="md:col-span-2" />
      {!isChecklist && (
        <>
          <Input placeholder="짧은 이름" value={f.short_label ?? ''} onChange={(e) => setF({ ...f, short_label: e.target.value })} />
          <Input type="date" value={f.start_date ?? ''} onChange={(e) => setF({ ...f, start_date: e.target.value })} />
          <Input type="date" value={f.end_date ?? ''} onChange={(e) => setF({ ...f, end_date: e.target.value })} />
          <Input placeholder="링크" value={f.link_url ?? ''} onChange={(e) => setF({ ...f, link_url: e.target.value })} />
        </>
      )}
      <div className={`flex gap-1 ${isChecklist ? 'md:col-start-8' : ''}`}>
        <Button size="sm" onClick={save} disabled={saveItem.isPending}>{row.id ? <Save size={14} /> : <Plus size={14} />}</Button>
        {row.id && (
          <Button size="sm" variant="ghost" onClick={() => confirm('삭제할까요?') && deleteItem.mutate(row.id!)}>
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdminElections() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { data, isLoading, isError } = useElectionsRaw();
  const [selected, setSelected] = useState<string | null>(null);

  if (adminLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const elections = data?.elections ?? [];
  const electionId = selected ?? elections.find((e) => e.role === 'current')?.id ?? elections[0]?.id ?? null;
  const items = (data?.items ?? []).filter((i) => i.election_id === electionId);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/admin"><Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button></Link>
        <h1 className="text-xl font-bold text-foreground">선거 일정 관리</h1>
      </div>

      {isLoading ? <Loader2 className="animate-spin" /> : isError ? (
        <p className="text-destructive text-sm">불러오지 못했어요. 새로고침해 주세요.</p>
      ) : (
        <>
          <section className="bg-card rounded-2xl p-4 space-y-2 border border-border/50">
            <h2 className="font-semibold text-foreground">선거</h2>
            <p className="text-xs text-muted-foreground">'현재 선거'는 하나만, '다음 선거'도 하나만 지정해 주세요. 현재 선거의 선거일이 지나면 자동 모드에서 평상시 화면으로 바뀝니다.</p>
            {elections.map((e) => <ElectionEditor key={e.id + e.updated_at} row={e} />)}
            <ElectionEditor row={{ role: 'archived' }} />
          </section>

          {electionId && (
            <section className="bg-card rounded-2xl p-4 space-y-4 border border-border/50">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground">일정 항목</h2>
                <Select value={electionId} onValueChange={setSelected}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {elections.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {(Object.keys(SCHEDULE_KIND_LABELS) as ScheduleKind[]).map((kind) => (
                <div key={kind} className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">{SCHEDULE_KIND_LABELS[kind]}</h3>
                  <p className="text-xs text-muted-foreground">
                    {kind === 'checklist' ? '순서 · 제목' : '순서 · 제목 · 짧은 이름 · 시작일 · 종료일 · 링크'}
                  </p>
                  {items.filter((i) => i.kind === kind).map((i) => <ItemEditor key={i.id + i.updated_at} row={i} />)}
                  <ItemEditor key={`${electionId}-${kind}-new`} row={{ election_id: electionId, kind }} />
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
