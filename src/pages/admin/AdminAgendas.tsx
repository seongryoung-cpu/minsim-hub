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
import { SIDO_LIST } from '@/types/region';
import type { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_LABELS: Record<string, string> = { draft: '초안', open: '진행 중', closed: '마감' };
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
