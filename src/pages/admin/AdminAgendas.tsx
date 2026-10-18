import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, EyeOff, Eye, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAdmin } from '@/hooks/useAdmin';
import {
  AGENDA_CATEGORIES,
  ISSUE_KIND_LABELS,
  effectiveAgendaStatus,
  formatAgendaDate,
  type IssueKind,
} from '@/hooks/useAgendas';
import {
  useAddAgendaLink,
  useAdminAgendaDetail,
  useAdminAgendaList,
  useAdminStatements,
  useAgendaLinkTargets,
  useDeleteAgenda,
  useDeleteAgendaLink,
  useDeleteIssue,
  useSaveAgenda,
  useSaveIssue,
  useSetStatementHidden,
  type AgendaForm,
} from '@/hooks/useAgendaAdmin';
import {
  CLAIM_STATUS_LABELS,
  useAdminClaims,
  useImportIssueCardsAsClaims,
  useUpdateClaimStatus,
  type ClaimStatus,
} from '@/hooks/useClaims';
import { useCandidateRanking } from '@/hooks/useQuickVote';
import {
  ROLE_KIND_LABELS,
  ROLE_ORDER,
  SOURCE_KIND_LABELS,
  useAgendaPositions,
  useDeletePosition,
  useSavePosition,
  type AgendaPosition,
  type PositionForm,
  type PositionRoleKind,
  type PositionSourceKind,
} from '@/hooks/useAgendaPositions';
import {
  STAGE_LABELS,
  useAdminAgendaBills,
  useLinkBill,
  useRefreshBill,
  useSavePlainSummary,
  useSearchBills,
  useSummarizeBill,
  useUnlinkBill,
  type AdminAgendaBill,
} from '@/hooks/useAgendaBills';
import { SIDO_LIST } from '@/types/region';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_LABELS: Record<string, string> = { draft: '초안', candidate: '후보 (빠른 투표)', open: '진행 중', closed: '마감' };
const NONE = '__none';

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}
function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : '저장하지 못했어요';
}

export function AdminAgendas() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { data: agendas, isLoading } = useAdminAgendaList(isAdmin);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate('/');
  }, [adminLoading, isAdmin, navigate]);

  if (adminLoading || (isAdmin && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  if (creating || editingId) {
    return (
      <AgendaEditor
        key={editingId ?? 'new'}
        id={editingId}
        onClose={() => {
          setCreating(false);
          setEditingId(null);
        }}
        onCreated={(id) => {
          setCreating(false);
          setEditingId(id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
          <button
            type="button"
            aria-label="관리자 홈으로"
            onClick={() => navigate('/admin')}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 text-lg font-semibold">공론 의제 관리</h1>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} className="mr-1" /> 새 의제
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          의제를 만들고 쟁점 카드를 쓴 뒤, 관련 공약을 연결하세요. ‘진행 중’으로 바꾸면 공론 허브에 보여요.
          모두에게 공개하려면 <Link to="/admin/settings" className="text-primary underline">시스템 설정</Link>의
          ‘공론 공개’를 켜세요.
        </p>
        <CandidateRanking onEdit={(id) => setEditingId(id)} />
        {!agendas || agendas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            아직 의제가 없어요. ‘새 의제’로 첫 의제를 만들어 보세요.
          </div>
        ) : (
          agendas.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setEditingId(a.id)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <Badge variant={a.status === 'open' ? 'default' : 'secondary'}>{STATUS_LABELS[a.status]}</Badge>
                {a.status === 'open' && effectiveAgendaStatus(a.status, a.closes_at) === 'closed' && (
                  <Badge variant="outline">마감 일시 지남 · 마감으로 표시됨</Badge>
                )}
                {a.is_featured && <Badge variant="outline">홈 배너</Badge>}
                {a.category && <span className="text-muted-foreground">{a.category}</span>}
                <span className="text-muted-foreground">· {a.region_sido ?? '전국'}</span>
                {a.closes_at && (
                  <span className="ml-auto text-muted-foreground">마감 {formatAgendaDate(a.closes_at)}</span>
                )}
              </div>
              <p className="mt-1.5 font-semibold">{a.title}</p>
            </button>
          ))
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 의제 편집
// ─────────────────────────────────────────────────────────────
const EMPTY_FORM: AgendaForm = {
  title: '',
  summary: '',
  split_reason: '',
  question: '',
  background: '',
  category: null,
  region_sido: null,
  status: 'draft',
  is_featured: false,
  opens_at: null,
  closes_at: null,
};

function AgendaEditor({
  id,
  onClose,
  onCreated,
}: {
  id: string | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { data: detail, isLoading } = useAdminAgendaDetail(id);
  const save = useSaveAgenda();
  const remove = useDeleteAgenda();
  const [form, setForm] = useState<AgendaForm>(EMPTY_FORM);

  useEffect(() => {
    const a = detail?.agenda;
    if (!a) return;
    setForm({
      title: a.title,
      summary: a.summary,
      split_reason: a.split_reason,
      question: a.question,
      background: a.background,
      category: a.category,
      region_sido: a.region_sido,
      status: a.status,
      is_featured: a.is_featured,
      opens_at: a.opens_at,
      closes_at: a.closes_at,
    });
  }, [detail?.agenda]);

  const set = <K extends keyof AgendaForm>(key: K, value: AgendaForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = () => {
    const title = form.title.trim();
    if (title.length < 2 || title.length > 80) {
      toast.error('제목은 2~80자로 써 주세요');
      return;
    }
    if (form.opens_at && form.closes_at && new Date(form.closes_at) <= new Date(form.opens_at)) {
      toast.error('마감일은 시작 시각보다 뒤여야 해요');
      return;
    }
    save.mutate(
      { id, form: { ...form, title } },
      {
        onSuccess: (savedId) => {
          toast.success('저장했어요');
          if (!id) onCreated(savedId);
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  const onDelete = () => {
    if (!id) return;
    if (!window.confirm('이 의제를 지울까요? 투표·한 줄 의견·연결도 함께 지워져요.')) return;
    remove.mutate(id, {
      onSuccess: () => {
        toast.success('지웠어요');
        onClose();
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  if (id && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
          <button
            type="button"
            aria-label="목록으로"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="flex-1 truncate text-lg font-semibold">{id ? '의제 편집' : '새 의제'}</h1>
          {id && (
            <Link
              to={`/gonglon/${id}`}
              className="flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:bg-secondary"
            >
              <ExternalLink size={15} /> 미리보기
            </Link>
          )}
          <Button size="sm" onClick={onSave} disabled={save.isPending}>
            {save.isPending ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Save size={16} className="mr-1" />}
            저장
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4">
        <section className="space-y-4 rounded-xl bg-card p-4 shadow-app-md md:p-6">
          <h2 className="text-lg font-semibold">기본 정보</h2>

          <Field label="제목" hint={`${form.title.length}/80`}>
            <Input value={form.title} maxLength={80} onChange={(e) => set('title', e.target.value)} placeholder="예: 청년 주거 지원 확대안" />
          </Field>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="상태">
              <Select value={form.status ?? 'draft'} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="카테고리">
              <Select value={form.category ?? NONE} onValueChange={(v) => set('category', v === NONE ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>없음</SelectItem>
                  {AGENDA_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="지역">
              <Select value={form.region_sido ?? NONE} onValueChange={(v) => set('region_sido', v === NONE ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>전국</SelectItem>
                  {SIDO_LIST.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="마감 일시">
              <Input
                type="datetime-local"
                value={toLocalInput(form.closes_at)}
                onChange={(e) => set('closes_at', fromLocalInput(e.target.value))}
              />
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary/40 p-3">
              <div>
                <Label htmlFor="featured">홈 배너 ‘이번 주 공론’</Label>
                <p className="text-xs text-muted-foreground">켜면 다른 의제의 홈 배너 지정은 꺼져요 (진행 중일 때만 보임)</p>
              </div>
              <Switch id="featured" checked={!!form.is_featured} onCheckedChange={(v) => set('is_featured', v)} />
            </div>
          </div>

          <Field label="현황 (허브 카드·홈 배너 요약에도 쓰여요)" hint={`${(form.summary ?? '').length}/200`}>
            <Textarea rows={2} maxLength={200} value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} placeholder="지금 어떤 상황인지 한두 줄" />
          </Field>
          <Field label="쟁점 (의견이 갈리는 이유)" hint={`${(form.split_reason ?? '').length}/300`}>
            <Textarea rows={2} maxLength={300} value={form.split_reason ?? ''} onChange={(e) => set('split_reason', e.target.value)} placeholder="의견이 갈리는 이유 한두 줄" />
          </Field>
          <Field label="결정 (투표 문장: 시민이 동의·비동의·유보할 문장)" hint={`${(form.question ?? '').length}/200`}>
            <Textarea rows={2} maxLength={200} value={form.question ?? ''} onChange={(e) => set('question', e.target.value)} placeholder="예: 청년 월세 지원 대상을 소득 하위 70%까지 넓혀야 한다" />
          </Field>
          <Field label="배경 자료 전체 (‘배경 자료 전체 보기’를 누르면 펼쳐져요)">
            <Textarea rows={6} value={form.background ?? ''} onChange={(e) => set('background', e.target.value)} />
          </Field>

          {id && (
            <div className="flex justify-end border-t border-border pt-4">
              <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete} disabled={remove.isPending}>
                <Trash2 size={15} className="mr-1" /> 의제 삭제
              </Button>
            </div>
          )}
        </section>

        {id && detail ? (
          <>
            <IssuesEditor agendaId={id} issues={detail.issues} />
            <LinksEditor agendaId={id} links={detail.links} />
            <PositionsEditor agendaId={id} />
            <BillsEditor agendaId={id} />
            <StatementsModeration agendaId={id} />
            <ClaimsModeration agendaId={id} />
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            먼저 저장하면 쟁점 카드와 공약 연결을 추가할 수 있어요.
          </p>
        )}
      </main>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs tabular-nums text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 쟁점 카드
// ─────────────────────────────────────────────────────────────
function IssuesEditor({ agendaId, issues }: { agendaId: string; issues: Tables<'agenda_issues'>[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-app-md md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">쟁점 카드 {issues.length > 0 && `(${issues.length})`}</h2>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus size={15} className="mr-1" /> 쟁점 추가
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        찬성·반대 논거는 같은 길이로, 숫자에는 출처를 붙여 주세요. 순서가 작은 것부터 보여요.
      </p>
      {issues.map((issue) => (
        <IssueRow key={issue.id} agendaId={agendaId} issue={issue} />
      ))}
      {adding && (
        <IssueRow agendaId={agendaId} issue={null} nextOrder={issues.length} onDone={() => setAdding(false)} />
      )}
    </section>
  );
}

function IssueRow({
  agendaId,
  issue,
  nextOrder = 0,
  onDone,
}: {
  agendaId: string;
  issue: Tables<'agenda_issues'> | null;
  nextOrder?: number;
  onDone?: () => void;
}) {
  const save = useSaveIssue();
  const remove = useDeleteIssue();
  const [kind, setKind] = useState<IssueKind>((issue?.kind as IssueKind) ?? 'pro');
  const [title, setTitle] = useState(issue?.title ?? '');
  const [body, setBody] = useState(issue?.body ?? '');
  const [sources, setSources] = useState((issue?.sources ?? []).join('\n'));
  const [order, setOrder] = useState(issue?.sort_order ?? nextOrder);

  const onSave = () => {
    if (title.trim().length < 2 || title.trim().length > 80) {
      toast.error('쟁점 제목은 2~80자로 써 주세요');
      return;
    }
    save.mutate(
      {
        agendaId,
        id: issue?.id ?? null,
        form: {
          kind,
          title: title.trim(),
          body,
          sources: sources.split('\n').map((s) => s.trim()).filter(Boolean),
          sort_order: Number(order) || 0,
        },
      },
      {
        onSuccess: () => {
          toast.success('쟁점을 저장했어요');
          onDone?.();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="grid gap-3 md:grid-cols-[160px_1fr_90px]">
        <Select value={kind} onValueChange={(v) => setKind(v as IssueKind)}>
          <SelectTrigger aria-label="종류"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(ISSUE_KIND_LABELS) as IssueKind[]).map((k) => (
              <SelectItem key={k} value={k}>{ISSUE_KIND_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input aria-label="쟁점 제목" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="쟁점 제목" />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0">순서</span>
          <Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} />
        </label>
      </div>
      <Textarea aria-label="본문" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="핵심 논거 2~3줄" />
      <Textarea
        aria-label="출처"
        rows={2}
        value={sources}
        onChange={(e) => setSources(e.target.value)}
        placeholder="출처 (한 줄에 하나, URL 또는 자료명)"
        className="text-xs"
      />
      <div className="flex justify-end gap-2">
        {issue ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm('이 쟁점 카드를 지울까요?')) {
                remove.mutate({ agendaId, id: issue.id }, { onError: (err) => toast.error(errorMessage(err)) });
              }
            }}
          >
            <Trash2 size={15} className="mr-1" /> 삭제
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onDone}>
            <X size={15} className="mr-1" /> 취소
          </Button>
        )}
        <Button size="sm" onClick={onSave} disabled={save.isPending}>
          <Save size={15} className="mr-1" /> 저장
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 연결표 (의제 ↔ 공약·정책카드)
// ─────────────────────────────────────────────────────────────
type LinkRow = {
  id: string;
  pledge_id: string | null;
  policy_card_id: string | null;
  candidate_pledges: { title: string; category: string; candidates: { name: string } | null } | null;
  policy_cards: { statement: string; category: string } | null;
};

function LinksEditor({ agendaId, links }: { agendaId: string; links: LinkRow[] }) {
  const { data: targets } = useAgendaLinkTargets();
  const add = useAddAgendaLink();
  const remove = useDeleteAgendaLink();
  const [pledgeId, setPledgeId] = useState('');
  const [cardId, setCardId] = useState('');

  const linkedPledges = new Set(links.map((l) => l.pledge_id).filter(Boolean));
  const linkedCards = new Set(links.map((l) => l.policy_card_id).filter(Boolean));

  const addLink = (input: { pledgeId?: string; policyCardId?: string }, reset: () => void) =>
    add.mutate(
      { agendaId, ...input },
      {
        onSuccess: () => {
          toast.success('연결했어요');
          reset();
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );

  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-app-md md:p-6">
      <h2 className="text-lg font-semibold">연결된 공약·정책카드 {links.length > 0 && `(${links.length})`}</h2>
      <p className="text-xs text-muted-foreground">
        연결된 공약 화면에 이 의제의 연결 카드가 붙어요 (공약마다 최대 2개). ‘관련 공약’은 찬반 입장이 아니라 주제가 같다는 뜻이에요.
      </p>

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 연결된 대상이 없어요.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {links.map((l) => (
            <li key={l.id} className="flex items-center gap-2 p-3 text-sm">
              <Badge variant="secondary">{l.pledge_id ? '공약' : '정책카드'}</Badge>
              <span className="min-w-0 flex-1 truncate">
                {l.candidate_pledges
                  ? `${l.candidate_pledges.candidates?.name ?? '?'} · ${l.candidate_pledges.title}`
                  : l.policy_cards?.statement ?? '(삭제된 대상)'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                aria-label="연결 해제"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ agendaId, id: l.id }, { onError: (err) => toast.error(errorMessage(err)) })}
              >
                <X size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
        <Select value={pledgeId} onValueChange={setPledgeId}>
          <SelectTrigger aria-label="공약 선택"><SelectValue placeholder="공약 선택 (후보 · 공약)" /></SelectTrigger>
          <SelectContent>
            {(targets?.pledges ?? [])
              .filter((p) => !linkedPledges.has(p.id))
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  [{p.category}] {p.candidates?.name ?? '?'} · {p.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" disabled={!pledgeId || add.isPending} onClick={() => addLink({ pledgeId }, () => setPledgeId(''))}>
          <Plus size={15} className="mr-1" /> 공약 연결
        </Button>
        <Select value={cardId} onValueChange={setCardId}>
          <SelectTrigger aria-label="정책카드 선택"><SelectValue placeholder="정책카드 선택" /></SelectTrigger>
          <SelectContent>
            {(targets?.policyCards ?? [])
              .filter((c) => !linkedCards.has(c.id))
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  [{c.category}] {c.statement}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" disabled={!cardId || add.isPending} onClick={() => addLink({ policyCardId: cardId }, () => setCardId(''))}>
          <Plus size={15} className="mr-1" /> 정책카드 연결
        </Button>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 관련 인물 입장 (출처 필수 · 권한 순서 · 찬반 분류 없음)
// ─────────────────────────────────────────────────────────────
function PositionsEditor({ agendaId }: { agendaId: string }) {
  const { data: positions } = useAgendaPositions(agendaId);
  const [editing, setEditing] = useState<AgendaPosition | 'new' | null>(null);
  const remove = useDeletePosition();

  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-app-md md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">관련 인물 입장 {positions && positions.length > 0 && `(${positions.length})`}</h2>
        {editing === null && (
          <Button size="sm" variant="outline" onClick={() => setEditing('new')}>
            <Plus size={15} className="mr-1" /> 입장 추가
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        인물 기준(현직 선출직, 직전 선거 후보, 정당 주요 당직, 지역위원장·당협위원장, 예비후보 등록자) 안의 사람만 넣어 주세요.
        모든 정당에 같은 기준을 적용하고, 찬성·반대로 분류하지 말고 발언 요지만 적어요. 출처 링크가 없으면 저장되지 않아요.
        화면에는 권한 순서({ROLE_ORDER.map((k) => ROLE_KIND_LABELS[k]).join(' → ')}), 같은 순서 안에서는 최근 발언 순으로 보여요.
      </p>

      {(positions ?? []).length === 0 && editing === null && (
        <p className="text-sm text-muted-foreground">아직 넣은 입장이 없어요.</p>
      )}
      <ul className="space-y-2">
        {(positions ?? []).map((p) =>
          editing !== 'new' && editing?.id === p.id ? (
            <li key={p.id}>
              <PositionFormRow agendaId={agendaId} initial={p} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={p.id} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs text-muted-foreground">
                  <Badge variant="secondary" className="mr-1.5">{ROLE_KIND_LABELS[p.role_kind as PositionRoleKind] ?? p.role_kind}</Badge>
                  <span className="font-semibold text-foreground">{p.person_name}</span>
                  {p.party ? ` · ${p.party}` : ''} · {p.role_label} · {p.spoken_on}
                  {p.is_hidden && <span className="ml-1.5 text-destructive">숨김</span>}
                </p>
                <p>{p.summary}</p>
                <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline">
                  {SOURCE_KIND_LABELS[p.source_kind as PositionSourceKind] ?? p.source_kind} <ExternalLink size={12} />
                </a>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>수정</Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="삭제"
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm(`${p.person_name}의 입장을 지울까요?`)) {
                    remove.mutate({ id: p.id, agendaId }, { onError: (err) => toast.error(errorMessage(err)) });
                  }
                }}
              >
                <Trash2 size={15} />
              </Button>
            </li>
          ),
        )}
      </ul>
      {editing === 'new' && <PositionFormRow agendaId={agendaId} initial={null} onDone={() => setEditing(null)} />}
    </section>
  );
}

const SOURCE_ORDER: PositionSourceKind[] = ['minutes', 'press', 'sns', 'news'];

function PositionFormRow({ agendaId, initial, onDone }: { agendaId: string; initial: Partial<AgendaPosition> | null; onDone: () => void }) {
  const save = useSavePosition();
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const [form, setForm] = useState<PositionForm>(() => ({
    id: initial?.id,
    agenda_id: agendaId,
    person_name: initial?.person_name ?? '',
    role_kind: initial?.role_kind ?? 'other',
    role_label: initial?.role_label ?? '',
    party: initial?.party ?? '',
    summary: initial?.summary ?? '',
    source_url: initial?.source_url ?? '',
    source_kind: initial?.source_kind ?? 'news',
    spoken_on: initial?.spoken_on ?? today,
    is_hidden: initial?.is_hidden ?? false,
  }));
  const set = <K extends keyof PositionForm>(k: K, v: PositionForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const urlOk = /^https?:\/\/\S+$/.test(form.source_url.trim());
  const valid =
    form.person_name.trim().length >= 2 &&
    form.role_label.trim().length >= 2 &&
    form.summary.trim().length >= 10 &&
    urlOk &&
    !!form.spoken_on &&
    form.spoken_on <= today;

  const submit = () =>
    save.mutate(form, {
      onSuccess: () => {
        toast.success('저장했어요');
        onDone();
      },
      onError: (err) => toast.error(errorMessage(err)),
    });

  return (
    <div className="space-y-3 rounded-lg border border-primary/40 p-3">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="이름">
          <Input maxLength={30} value={form.person_name} onChange={(e) => set('person_name', e.target.value)} />
        </Field>
        <Field label="정당 (무소속이면 비움)">
          <Input maxLength={30} value={form.party ?? ''} onChange={(e) => set('party', e.target.value)} />
        </Field>
        <Field label="직책 표기" hint="예: 국회 국토교통위원장">
          <Input maxLength={40} value={form.role_label} onChange={(e) => set('role_label', e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="이 의제에 대한 권한 (정렬 순서)">
          <Select value={form.role_kind} onValueChange={(v) => set('role_kind', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLE_ORDER.map((k, i) => (
                <SelectItem key={k} value={k}>{i + 1}. {ROLE_KIND_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="출처 종류">
          <Select value={form.source_kind} onValueChange={(v) => set('source_kind', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCE_ORDER.map((k) => (
                <SelectItem key={k} value={k}>{SOURCE_KIND_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="발언 날짜">
          <Input type="date" max={today} value={form.spoken_on} onChange={(e) => set('spoken_on', e.target.value)} />
        </Field>
      </div>
      <Field label="발언 요지 (찬반으로 분류하지 말고, 말한 내용 그대로 요약)" hint={`${form.summary.length}/300`}>
        <Textarea rows={3} maxLength={300} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
      </Field>
      <Field label="원문 출처 링크 (필수)">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://"
          value={form.source_url}
          aria-invalid={form.source_url.length > 0 && !urlOk}
          onChange={(e) => set('source_url', e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={!!form.is_hidden} onCheckedChange={(v) => set('is_hidden', v)} /> 화면에서 숨기기
        </label>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDone}>취소</Button>
          <Button size="sm" disabled={!valid || save.isPending} onClick={submit}>
            {save.isPending ? <Loader2 size={15} className="mr-1 animate-spin" /> : <Save size={15} className="mr-1" />}
            저장
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 관련 법안 (열린국회정보 검색 → 연결 → 시민의 말 요약 승인)
// ─────────────────────────────────────────────────────────────
function BillsEditor({ agendaId }: { agendaId: string }) {
  const { data: linked } = useAdminAgendaBills(agendaId);
  const search = useSearchBills();
  const link = useLinkBill(agendaId);
  const [q, setQ] = useState('');
  const linkedIds = new Set((linked ?? []).map((b) => b.bill_id));

  const runSearch = () => {
    const v = q.trim();
    if (v.length < 2) return;
    search.mutate(v, { onError: (err) => toast.error(errorMessage(err)) });
  };

  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-app-md md:p-6">
      <h2 className="text-lg font-semibold">관련 법안 {linked && linked.length > 0 && `(${linked.length})`}</h2>
      <p className="text-xs text-muted-foreground">
        국회(22대) 의안을 이름으로 찾아 연결해요. 연결하면 진행 단계·표결을 가져오고, 매일 아침 다시 확인해요.
        시민에게는 승인한 요약(무엇이 바뀌나·누가·언제부터)만 보여요. 평가나 찬반 표현은 넣지 마세요. 출처: 열린국회정보
      </p>

      {(linked ?? []).map((b) => (
        <LinkedBillRow key={b.id} agendaId={agendaId} bill={b} />
      ))}

      <div className="flex gap-2">
        <Input
          value={q}
          maxLength={40}
          placeholder="법률 이름으로 검색 (예: 도시철도법, 노인복지법)"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
        />
        <Button size="sm" variant="outline" disabled={q.trim().length < 2 || search.isPending} onClick={runSearch}>
          {search.isPending ? <Loader2 size={15} className="animate-spin" /> : '검색'}
        </Button>
      </div>
      {search.data && (
        search.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">검색 결과가 없어요. 법률 이름을 더 짧게 넣어 보세요.</p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {search.data.map((r) => (
              <li key={r.bill_id} className="flex items-start gap-2 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{r.bill_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.bill_no} · {r.proposer} · {r.committee ?? '위원회 미정'} · {r.propose_dt} · {r.proc_result ?? r.pass_gubun ?? ''}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={linkedIds.has(r.bill_id) || link.isPending}
                  onClick={() => link.mutate(r.bill_id, { onSuccess: () => toast.success('연결했어요'), onError: (err) => toast.error(errorMessage(err)) })}
                >
                  {linkedIds.has(r.bill_id) ? '연결됨' : '연결'}
                </Button>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
}

function LinkedBillRow({ agendaId, bill }: { agendaId: string; bill: AdminAgendaBill }) {
  const refresh = useRefreshBill(agendaId);
  const summarize = useSummarizeBill(agendaId);
  const save = useSavePlainSummary(agendaId);
  const unlink = useUnlinkBill(agendaId);
  const [what, setWhat] = useState(bill.plain_what ?? '');
  const [who, setWho] = useState(bill.plain_who ?? '');
  const [when, setWhen] = useState(bill.plain_when ?? '');
  const [addingPerson, setAddingPerson] = useState<string | null>(null);
  const a = bill.assembly_bills;
  const draft = bill.plain_draft;
  const approved = !!bill.plain_approved_at;
  const sponsors = (a?.rst_proposer ?? '').split(/[,ㆍ·]/).map((x) => x.trim()).filter((x) => x.length >= 2);

  const loadDraft = () => {
    if (!draft) return;
    setWhat(draft.what ?? '');
    setWho(draft.who ?? '');
    setWhen(draft.when ?? '');
  };
  const persist = (approve: boolean) =>
    save.mutate(
      { id: bill.id, what, who, when, approve },
      { onSuccess: () => toast.success(approve ? '승인했어요. 시민 화면에 보여요' : '저장했어요 (공개 안 함)'), onError: (err) => toast.error(errorMessage(err)) },
    );

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-medium">{a?.bill_name ?? bill.bill_id}</p>
          <p className="text-xs text-muted-foreground">
            <Badge variant="secondary" className="mr-1.5">{a ? STAGE_LABELS[a.stage] : '-'}</Badge>
            {a?.bill_no} · {a?.proposer} · {a?.committee ?? '위원회 미정'} · 마지막 확인 {a ? new Date(a.synced_at).toLocaleString('ko-KR') : '-'}
          </p>
        </div>
        {a?.detail_link && (
          <a href={a.detail_link} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-foreground" aria-label="의안정보시스템에서 보기">
            <ExternalLink size={15} />
          </a>
        )}
        <Button size="sm" variant="ghost" disabled={refresh.isPending} onClick={() => refresh.mutate(bill.bill_id, { onSuccess: () => toast.success('다시 가져왔어요'), onError: (err) => toast.error(errorMessage(err)) })}>
          {refresh.isPending ? <Loader2 size={15} className="animate-spin" /> : '다시 가져오기'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="연결 해제"
          disabled={unlink.isPending}
          onClick={() => { if (window.confirm('이 법안 연결을 지울까요?')) unlink.mutate(bill.id, { onError: (err) => toast.error(errorMessage(err)) }); }}
        >
          <X size={16} />
        </Button>
      </div>

      <div className="space-y-2 rounded-lg bg-secondary/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            시민의 말로 쓴 요약 {approved ? <Badge className="ml-1">공개 중</Badge> : <Badge variant="outline" className="ml-1">공개 안 함</Badge>}
          </p>
          <div className="flex gap-1.5">
            {draft && (
              <Button size="sm" variant="outline" onClick={loadDraft}>AI 초안 불러오기</Button>
            )}
            <Button size="sm" variant="outline" disabled={summarize.isPending} onClick={() => summarize.mutate(bill.id, { onSuccess: () => toast.success('AI 초안을 만들었어요. 불러와서 고쳐 주세요'), onError: (err) => toast.error(errorMessage(err)) })}>
              {summarize.isPending ? <Loader2 size={15} className="mr-1 animate-spin" /> : null}
              {draft ? 'AI 초안 다시 만들기' : 'AI 초안 만들기'}
            </Button>
          </div>
        </div>
        {draft && !draft.read_reason && (
          <p className="text-xs text-destructive">제안이유를 읽지 못해 법안 이름만으로 만든 초안이에요. 원문을 꼭 확인해 주세요.</p>
        )}
        <Field label="무엇이 바뀌나" hint={`${what.length}/200`}>
          <Textarea rows={2} maxLength={200} value={what} onChange={(e) => setWhat(e.target.value)} />
        </Field>
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="누가 영향을 받나" hint={`${who.length}/120`}>
            <Input maxLength={120} value={who} onChange={(e) => setWho(e.target.value)} />
          </Field>
          <Field label="언제부터" hint={`${when.length}/80`}>
            <Input maxLength={80} value={when} onChange={(e) => setWhen(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => persist(false)}>
            {approved ? '공개 내리고 저장' : '저장만'}
          </Button>
          <Button size="sm" disabled={save.isPending || what.trim().length < 5} onClick={() => persist(true)}>
            <Save size={15} className="mr-1" /> 승인하고 공개
          </Button>
        </div>
      </div>

      {sponsors.length > 0 && !addingPerson && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          관련 인물 입장 후보:
          {sponsors.map((name) => (
            <Button key={name} size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setAddingPerson(name)}>
              <Plus size={13} className="mr-0.5" /> {name} (대표발의자)
            </Button>
          ))}
        </div>
      )}
      {addingPerson && (
        <PositionFormRow
          agendaId={agendaId}
          initial={{ person_name: addingPerson, role_kind: 'bill_sponsor', role_label: `${a?.bill_name ?? '관련 법안'} 대표발의자`.slice(0, 40) }}
          onDone={() => setAddingPerson(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 한 줄 의견 숨김
// ─────────────────────────────────────────────────────────────
function StatementsModeration({ agendaId }: { agendaId: string }) {
  const { data: statements } = useAdminStatements(agendaId);
  const setHidden = useSetStatementHidden();

  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-app-md md:p-6">
      <h2 className="text-lg font-semibold">한 줄 의견 {statements && statements.length > 0 && `(${statements.length})`}</h2>
      <p className="text-xs text-muted-foreground">
        개인정보·욕설·허위 사실이 담긴 의견은 숨기세요. 숨긴 의견은 작성자 본인과 관리자에게만 보여요.
      </p>
      {!statements || statements.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 한 줄 의견이 없어요.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {statements.map((s) => (
            <li key={s.id} className="flex items-start gap-2 p-3 text-sm">
              <span className={s.is_hidden ? 'flex-1 text-muted-foreground line-through' : 'flex-1'}>{s.body}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={setHidden.isPending}
                onClick={() =>
                  setHidden.mutate(
                    { agendaId, id: s.id, hidden: !s.is_hidden },
                    { onError: (err) => toast.error(errorMessage(err)) },
                  )
                }
              >
                {s.is_hidden ? <Eye size={15} className="mr-1" /> : <EyeOff size={15} className="mr-1" />}
                {s.is_hidden ? '다시 보이기' : '숨기기'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const CLAIM_STATUSES: ClaimStatus[] = ['new', 'review', 'verified', 'hidden'];

/** 주장 검토 (공론 2단계). 스위치가 꺼져 있어도 관리자는 미리 정리해 둘 수 있다. */
function ClaimsModeration({ agendaId }: { agendaId: string }) {
  const { data: claims } = useAdminClaims(agendaId);
  const setStatus = useUpdateClaimStatus();
  const importCards = useImportIssueCardsAsClaims();

  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-app-md md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">주장 {claims && claims.length > 0 && `(${claims.length})`}</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={importCards.isPending}
            onClick={() =>
              importCards.mutate(agendaId, {
                onSuccess: (n) => toast.success(n > 0 ? `찬성·반대 카드 ${n}개를 주장으로 옮겼어요` : '새로 옮길 카드가 없어요'),
                onError: (err) => toast.error(errorMessage(err)),
              })
            }
          >
            찬성·반대 카드를 주장으로
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link to={`/gonglon/${agendaId}/claims`}>
              <ExternalLink size={15} className="mr-1" /> 시민 화면
            </Link>
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        시민이 쓴 주장은 '신규'로 들어와요. 근거를 확인했으면 '검증 완료', 비방·개인정보·허위 사실은 '숨김'으로 바꾸세요.
        운영진이 정리한 주장(작성자 없음)은 처음부터 검증 완료예요.
      </p>
      {!claims || claims.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 주장이 없어요.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {claims.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 space-y-1">
                <p className={c.status === 'hidden' ? 'text-muted-foreground line-through' : 'font-medium'}>{c.body}</p>
                <p className="text-xs text-muted-foreground">
                  {c.user_id ? '시민' : '운영진'} · {formatAgendaDate(c.created_at)}
                  {c.reason ? ' · 근거 있음' : ''}
                  {c.sources.length > 0 ? ` · 출처 ${c.sources.length}` : ''}
                </p>
              </div>
              <Select
                value={c.status}
                onValueChange={(v) =>
                  setStatus.mutate(
                    { agendaId, claimId: c.id, status: v as ClaimStatus },
                    { onError: (err) => toast.error(errorMessage(err)) },
                  )
                }
              >
                <SelectTrigger className="h-9 w-full sm:w-32" aria-label="검증 상태">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLAIM_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {CLAIM_STATUS_LABELS[st]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * 후보 의제 승격 순위 (빠른 투표).
 * 점수 = (참여 + 더 알고 싶어요 × 3) × (0.4 + 0.6 × 갈림 정도). 가중치는 초안이고, 올릴지는 운영자가 정한다.
 */
function CandidateRanking({ onEdit }: { onEdit: (id: string) => void }) {
  const { data: rows } = useCandidateRanking();
  if (!rows || rows.length === 0) return null;

  return (
    <section className="space-y-3 rounded-xl bg-card p-4 shadow-app-md md:p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">빠른 투표 · 승격 순위</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          후보 의제는 공론 탭 맨 위 카드로 보여요. 카드에는 ‘결정’ 문장과 ‘한 줄 요약’이 그대로 나가요.
          찬반이 고르게 갈리고 ‘더 알고 싶어요’가 많을수록 점수가 높아요. 올릴 의제는 쟁점 카드를 붙인 뒤 상태를 ‘진행 중’으로 바꾸세요.
          그러면 ‘더 알고 싶어요’를 누른 사람에게 알림이 가요.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">의제</th>
              <th className="px-2 py-2 text-right font-medium">참여</th>
              <th className="px-2 py-2 text-right font-medium">찬성·반대·모름</th>
              <th className="px-2 py-2 text-right font-medium">더 알고 싶어요</th>
              <th className="px-2 py-2 text-right font-medium">갈림</th>
              <th className="px-2 py-2 text-right font-medium">점수</th>
              <th className="py-2 pl-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-2.5 pr-3 font-medium">{r.title}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{r.votes}</td>
                <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
                  {r.agree}·{r.disagree}·{r.hold}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">{r.interested}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{Math.round(Number(r.divisiveness) * 100)}%</td>
                <td className="px-2 py-2.5 text-right font-semibold tabular-nums">{r.score}</td>
                <td className="py-2.5 pl-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => onEdit(r.id)}>
                    편집해서 올리기
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
