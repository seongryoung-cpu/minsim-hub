import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, CircleHelp, Landmark, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SIDO_LIST, type Region } from '@/types/region';
import { useAppMode } from '@/hooks/useAppMode';
import { useAgendaList, useGonglonAccess } from '@/hooks/useAgendas';
import {
  KIND_LABELS,
  KIND_ORDER,
  headToRow,
  isLocalMember,
  memberToRow,
  sortRows,
  useAssemblyMembers,
  useMetroHeads,
  type PoliticianKind,
  type PoliticianRow,
} from '@/hooks/usePoliticians';
import { AppModePending } from '@/components/dashboard/AppModePending';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Election } from '@/pages/Election';

type View = 'local' | 'all' | 'election';
const VIEWS: { id: View; label: string }[] = [
  { id: 'local', label: '우리 동네' },
  { id: 'all', label: '전체' },
  { id: 'election', label: '선거' },
];

interface Props {
  region: Region;
  onRegionClick: () => void;
}

/** 정치인 탭: 우리를 대표하는 사람들 (우리 동네 · 전체 · 선거) */
export function Politicians({ region, onRegionClick }: Props) {
  const [params, setParams] = useSearchParams();
  const appMode = useAppMode();
  const asked = params.get('view') as View | null;
  const view: View | null = asked && VIEWS.some((v) => v.id === asked)
    ? asked
    : appMode.mode === null ? null : appMode.mode === 'election' ? 'election' : 'local';

  const setView = (v: View, extra?: Record<string, string>) => {
    const next = new URLSearchParams({ view: v, ...(extra ?? {}) });
    setParams(next, { replace: true });
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <Landmark size={22} className="text-primary" aria-hidden />
          <h1 className="text-lg font-semibold text-foreground">정치인</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        <div className="flex items-center gap-1">
          <h2 className="text-[22px] font-bold leading-tight">우리를 대표하는 사람들</h2>
          <OrderHelp />
        </div>

        <div role="tablist" aria-label="보기" className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              role="tab"
              type="button"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={cn(
                'h-10 rounded-lg text-sm font-semibold transition-colors',
                view === v.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === null ? (
        <AppModePending isError={appMode.isError} onRetry={appMode.retry} />
      ) : view === 'election' ? (
        <Election embedded />
      ) : view === 'all' ? (
        <AllView initialKind={(params.get('kind') as PoliticianKind | null) ?? undefined} />
      ) : (
        <LocalView region={region} onRegionClick={onRegionClick} onShowPr={() => setView('all', { kind: 'assembly_pr' })} />
      )}
    </div>
  );
}

function OrderHelp() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="어떤 순서로 보여 주나요?"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
      >
        <CircleHelp size={18} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 text-[13px] leading-relaxed">
        <p className="font-semibold text-foreground">직책별로 묶고, 그 안에서는 가나다순이에요</p>
        <p className="text-muted-foreground">
          광역단체장 → 지역구 국회의원 → 비례대표 국회의원 순서예요. 인기나 정당에 따라 순서를 바꾸지 않아요.
        </p>
        <p className="text-muted-foreground">
          국회의원 정보는 국회(열린국회정보)에서 매일 아침 확인해요. 시장·군수·구청장과 지방의원은 준비 중이에요.
        </p>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────
// 우리 동네
// ─────────────────────────────────────────────────────────────
function LocalView({ region, onRegionClick, onShowPr }: { region: Region; onRegionClick: () => void; onShowPr: () => void }) {
  const members = useAssemblyMembers();
  const heads = useMetroHeads();
  const gonglon = useGonglonAccess();
  const agendas = useAgendaList(region.sido, gonglon.allowed);

  const wholeSido = !region.sigungu || region.sigungu === '전체';
  const place = wholeSido ? region.sido : `${region.sido} ${region.sigungu}`;

  const localHeads = useMemo(
    () => (heads.data ?? []).map(headToRow).filter((r) => r.sidos.includes(region.sido)),
    [heads.data, region.sido],
  );
  const localMembers = useMemo(
    () => sortRows((members.data ?? []).filter((m) => isLocalMember(m, region)).map(memberToRow)),
    [members.data, region],
  );
  const prCount = useMemo(() => (members.data ?? []).filter((m) => m.elect_type === '비례대표').length, [members.data]);
  const localAgendas = (agendas.data ?? []).filter((a) => a.region_sido === region.sido).slice(0, 3);
  const lastSync = (members.data ?? []).map((m) => m.synced_at).sort().at(-1);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <MapPin size={15} className="text-primary" aria-hidden /> {place}
        </p>
        <button
          type="button"
          onClick={onRegionClick}
          className="h-9 rounded-full px-3 text-[13px] font-semibold text-primary hover:bg-primary/5"
        >
          지역 바꾸기
        </button>
      </div>

      <Group title="단체장" loading={heads.isLoading} rows={localHeads} empty="이 지역 단체장 정보가 아직 없어요" />

      <Group
        title={wholeSido ? '지역구 국회의원' : '우리 지역구 국회의원'}
        loading={members.isLoading}
        error={members.isError}
        rows={localMembers}
        empty="국회 명단에 이 지역 국회의원이 없어요. 재·보궐선거 전이라 자리가 비어 있을 수 있어요"
      />

      {prCount > 0 && (
        <button
          type="button"
          onClick={onShowPr}
          className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 text-left hover:bg-secondary/50"
        >
          <span>
            <span className="block text-[15px] font-semibold">비례대표 국회의원 {prCount}명</span>
            <span className="block text-xs text-muted-foreground">특정 지역이 아니라 전국을 대표해요</span>
          </span>
          <ChevronRight size={18} className="text-muted-foreground" aria-hidden />
        </button>
      )}

      {localAgendas.length > 0 && (
        <section aria-labelledby="local-agendas" className="space-y-2">
          <h3 id="local-agendas" className="text-[15px] font-bold">우리 지역 공론</h3>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {localAgendas.map((a) => (
              <li key={a.id}>
                <Link to={`/gonglon/${a.id}`} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/50">
                  <span className="text-sm font-medium leading-snug">{a.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">참여 {a.participants}명</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SourceNote lastSync={lastSync} />
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// 전체
// ─────────────────────────────────────────────────────────────
function AllView({ initialKind }: { initialKind?: PoliticianKind }) {
  const members = useAssemblyMembers();
  const heads = useMetroHeads();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<PoliticianKind | ''>(initialKind && KIND_ORDER.includes(initialKind) ? initialKind : '');
  const [party, setParty] = useState('');
  const [sido, setSido] = useState('');
  const [committee, setCommittee] = useState('');

  const rows = useMemo(
    () => sortRows([...(heads.data ?? []).map(headToRow), ...(members.data ?? []).map(memberToRow)]),
    [heads.data, members.data],
  );
  const parties = useMemo(() => uniqueSorted(rows.map((r) => r.party)), [rows]);
  const committees = useMemo(
    () => uniqueSorted(rows.flatMap((r) => r.committees)),
    [rows],
  );

  const query = q.trim();
  const filtered = rows.filter(
    (r) =>
      (!query || r.name.includes(query)) &&
      (!kind || r.kind === kind) &&
      (!party || r.party === party) &&
      (!sido || r.sidos.includes(sido)) &&
      (!committee || r.committees.includes(committee)),
  );
  const filtering = !!(query || kind || party || sido || committee);
  const lastSync = (members.data ?? []).map((m) => m.synced_at).sort().at(-1);

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
      <label className="relative block">
        <span className="sr-only">이름으로 찾기</span>
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름으로 찾기"
          className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-[15px] outline-none focus:border-primary"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <FilterSelect label="직책" value={kind} onChange={(v) => setKind(v as PoliticianKind | '')}
          options={KIND_ORDER.map((k) => ({ value: k, label: KIND_LABELS[k] }))} />
        <FilterSelect label="정당" value={party} onChange={setParty} options={parties.map((p) => ({ value: p, label: p }))} />
        <FilterSelect label="지역" value={sido} onChange={setSido} options={SIDO_LIST.map((s) => ({ value: s, label: s }))} />
        <FilterSelect label="위원회" value={committee} onChange={setCommittee} options={committees.map((c) => ({ value: c, label: c }))} />
      </div>

      {filtering && (
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">{filtered.length}명</span>
          <button
            type="button"
            onClick={() => { setQ(''); setKind(''); setParty(''); setSido(''); setCommittee(''); }}
            className="h-9 px-2 font-semibold text-primary"
          >
            조건 지우기
          </button>
        </div>
      )}

      {members.isLoading || heads.isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="space-y-6">
          {KIND_ORDER.map((k) => {
            const list = filtered.filter((r) => r.kind === k);
            if (list.length === 0) return null;
            return <Group key={k} title={`${KIND_LABELS[k]} ${list.length}명`} rows={list} />;
          })}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 사람이 없어요</p>
          )}
        </div>
      )}

      <SourceNote lastSync={lastSync} />
    </main>
  );
}

function uniqueSorted(list: (string | null | undefined)[]) {
  return [...new Set(list.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, 'ko'));
}

function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 w-full truncate rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary',
          value ? 'border-primary font-semibold text-primary' : 'border-border text-foreground',
        )}
      >
        <option value="">{label} 전체</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// 공통
// ─────────────────────────────────────────────────────────────
function Group({
  title, rows, loading, error, empty,
}: { title: string; rows: PoliticianRow[]; loading?: boolean; error?: boolean; empty?: string }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[15px] font-bold">{title}</h3>
      {loading ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          {error ? '정보를 불러오지 못했어요. 잠시 후 다시 열어 주세요' : empty}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {rows.map((r) => (
            <li key={r.key}>
              <PersonRow row={r} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PersonRow({ row }: { row: PoliticianRow }) {
  return (
    <Link to={row.path} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[15px] font-bold text-foreground/70"
      >
        {row.initial}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold">{row.name}</span>
          {row.party && <span className="truncate text-xs text-muted-foreground">{row.party}</span>}
        </span>
        <span className="block truncate text-[13px] text-foreground/80">{row.title}</span>
        {row.sub && <span className="block truncate text-xs text-muted-foreground">{row.sub}</span>}
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="불러오는 중">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
      ))}
    </div>
  );
}

function SourceNote({ lastSync }: { lastSync?: string }) {
  return (
    <p className="pb-4 text-xs leading-relaxed text-muted-foreground">
      출처: 국회의원 열린국회정보{lastSync ? ` (${lastSync.slice(0, 10).replace(/-/g, '.')} 확인)` : ''} · 광역단체장 2026 지방선거 당선인
    </p>
  );
}
