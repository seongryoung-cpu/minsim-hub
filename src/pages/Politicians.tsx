import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, CircleHelp, Landmark, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SIDO_LIST, SIDO_SHORT, type Region } from '@/types/region';
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
  type PoliticianRow,
} from '@/hooks/usePoliticians';
import { PersonPhoto } from '@/components/politicians/PersonPhoto';
import { AppModePending } from '@/components/dashboard/AppModePending';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Election } from '@/pages/Election';

type View = 'local' | 'all' | 'election';
const VIEWS: { id: View; label: string }[] = [
  { id: 'local', label: '우리 동네' },
  { id: 'all', label: '찾아보기' },
  { id: 'election', label: '선거' },
];

interface Props {
  region: Region;
  onRegionClick: () => void;
}

/** 정치인 탭: 우리를 대표하는 사람들 (우리 동네 · 찾아보기 · 선거) */
export function Politicians({ region, onRegionClick }: Props) {
  const [params, setParams] = useSearchParams();
  const appMode = useAppMode();
  const asked = params.get('view') as View | null;
  const view: View | null = asked && VIEWS.some((v) => v.id === asked)
    ? asked
    : appMode.mode === null ? null : appMode.mode === 'election' ? 'election' : 'local';

  const setView = (v: View, extra?: Record<string, string>) => {
    const next = new URLSearchParams({ view: v, ...(extra ?? {}) });
    // 분류를 고르는 건 뒤로 가기로 돌아올 수 있게 기록을 남긴다
    setParams(next, { replace: v !== 'all' || !extra?.by });
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
        <BrowseView
          by={(BY_ORDER as string[]).includes(params.get('by') ?? '') ? (params.get('by') as By) : null}
          val={params.get('val')}
          onPick={(b, v) => setView('all', b && v ? { by: b, val: v } : {})}
        />
      ) : (
        <LocalView region={region} onRegionClick={onRegionClick} onShowPr={() => setView('all', { by: 'kind', val: 'assembly_pr' })} />
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
          국회의원 정보는 국회(열린국회정보)에서 매일 오전 9시에 확인해요. 시장·군수·구청장과 지방의원은 준비 중이에요.
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
// 찾아보기: 처음엔 목록 없이 검색 + 분류만. 분류를 고르면 그 사람들만 보여 준다
// ─────────────────────────────────────────────────────────────
type By = 'sido' | 'party' | 'committee' | 'kind';
const BY_LABELS: Record<By, string> = { sido: '지역으로', party: '정당으로', committee: '위원회로', kind: '직책으로' };
const BY_ORDER: By[] = ['sido', 'party', 'committee', 'kind'];

function BrowseView({ by, val, onPick }: { by: By | null; val: string | null; onPick: (by: By | null, val: string | null) => void }) {
  const members = useAssemblyMembers();
  const heads = useMetroHeads();
  const [q, setQ] = useState('');

  const rows = useMemo(
    () => sortRows([...(heads.data ?? []).map(headToRow), ...(members.data ?? []).map(memberToRow)]),
    [heads.data, members.data],
  );

  // 분류별 인원 (가나다순으로 늘어놓는다. 인원 많은 순으로 하면 큰 정당이 늘 앞에 와서)
  const groups = useMemo(() => {
    const count = (keys: string[]) => {
      const m = new Map<string, number>();
      for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
      return m;
    };
    const sido = count(rows.flatMap((r) => r.sidos));
    const party = count(rows.map((r) => r.party ?? '').filter(Boolean));
    const committee = count(rows.flatMap((r) => r.committees));
    const kind = count(rows.map((r) => r.kind));
    return {
      sido: SIDO_LIST.filter((x) => sido.has(x)).map((x) => ({ value: x, label: SIDO_SHORT[x], n: sido.get(x)! })),
      party: [...party].sort((a, b) => a[0].localeCompare(b[0], 'ko')).map(([x, n]) => ({ value: x, label: x, n })),
      committee: [...committee].sort((a, b) => a[0].localeCompare(b[0], 'ko')).map(([x, n]) => ({ value: x, label: x.replace(/위원회$/, ''), n })),
      kind: KIND_ORDER.filter((k) => kind.has(k)).map((k) => ({ value: k, label: KIND_LABELS[k], n: kind.get(k)! })),
    } satisfies Record<By, { value: string; label: string; n: number }[]>;
  }, [rows]);

  const query = q.trim();
  const picked = by && val
    ? rows.filter((r) =>
        by === 'sido' ? r.sidos.includes(val)
          : by === 'party' ? r.party === val
            : by === 'committee' ? r.committees.includes(val)
              : r.kind === val)
    : null;
  const searched = query ? rows.filter((r) => r.name.includes(query)) : null;
  const pickedLabel = by && val ? groups[by].find((g) => g.value === val)?.label ?? val : '';
  const lastSync = (members.data ?? []).map((m) => m.synced_at).sort().at(-1);
  const loading = members.isLoading || heads.isLoading;

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
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

      {loading ? (
        <ListSkeleton />
      ) : searched ? (
        <ResultGroups rows={searched} empty={`'${query}' 이름의 정치인이 없어요`} />
      ) : picked ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[17px] font-bold">
              {pickedLabel} <span className="text-sm font-normal text-muted-foreground">{picked.length}명</span>
            </h3>
            <button type="button" onClick={() => onPick(null, null)} className="h-9 rounded-full px-3 text-[13px] font-semibold text-primary hover:bg-primary/5">
              다른 분류 보기
            </button>
          </div>
          <ResultGroups rows={picked} empty="이 분류에 해당하는 사람이 없어요" />
        </section>
      ) : (
        <div className="space-y-5">
          {BY_ORDER.map((b) => (
            <section key={b} aria-labelledby={`by-${b}`} className="space-y-2">
              <h3 id={`by-${b}`} className="text-[15px] font-bold">{BY_LABELS[b]}</h3>
              <ul className="flex flex-wrap gap-2">
                {groups[b].map((g) => (
                  <li key={g.value}>
                    <button
                      type="button"
                      onClick={() => onPick(b, g.value)}
                      className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-sm font-medium hover:border-primary hover:text-primary"
                    >
                      {g.label}
                      <span className="text-xs text-muted-foreground">{g.n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="text-xs text-muted-foreground">지역 인원에는 광역단체장과 지역구 국회의원이 들어가요. 비례대표는 '직책으로'에서 볼 수 있어요.</p>
        </div>
      )}

      <SourceNote lastSync={lastSync} />
    </main>
  );
}

/** 직책별로 묶어서, 많으면 20명씩 */
function ResultGroups({ rows, empty }: { rows: PoliticianRow[]; empty: string }) {
  if (rows.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-6">
      {KIND_ORDER.map((k) => {
        const list = rows.filter((r) => r.kind === k);
        if (list.length === 0) return null;
        return <Group key={k} title={`${KIND_LABELS[k]} ${list.length}명`} rows={list} pageSize={20} />;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 공통
// ─────────────────────────────────────────────────────────────
function Group({
  title, rows, loading, error, empty, pageSize,
}: { title: string; rows: PoliticianRow[]; loading?: boolean; error?: boolean; empty?: string; pageSize?: number }) {
  const [shown, setShown] = useState(pageSize ?? Infinity);
  const visible = rows.slice(0, shown);
  const rest = rows.length - visible.length;
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
          {visible.map((r) => (
            <li key={r.key}>
              <PersonRow row={r} />
            </li>
          ))}
        </ul>
      )}
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setShown((n) => n + (pageSize ?? 20))}
          className="h-11 w-full rounded-xl border border-dashed border-border text-sm font-semibold text-primary hover:bg-primary/5"
        >
          {Math.min(rest, pageSize ?? 20)}명 더 보기 <span className="font-normal text-muted-foreground">(남은 {rest}명)</span>
        </button>
      )}
    </section>
  );
}

function PersonRow({ row }: { row: PoliticianRow }) {
  return (
    <Link to={row.path} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50">
      <PersonPhoto src={row.photo} initial={row.initial} width={48} />
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
