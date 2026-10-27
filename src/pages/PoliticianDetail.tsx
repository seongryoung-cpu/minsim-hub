import { useCallback, useMemo, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Building2, ChevronDown, ChevronLeft, Globe, Mail, Phone, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  headPhotoUrl, memberPhotoUrl, useAssemblyMembers, useMemberCareer, usePoliticianActivity, type PoliticianActivity,
} from '@/hooks/usePoliticians';
import { useCandidateBySlug } from '@/hooks/useCandidates';
import { useNewsForCandidate } from '@/hooks/useNews';
import { useElectionSchedule } from '@/hooks/useElections';
import { useGonglonAccess, useLinkedAgendas } from '@/hooks/useAgendas';
import { PersonPhotoZoom } from '@/components/politicians/PersonPhoto';
import { FollowButton } from '@/components/candidate/FollowButton';
import { ElectionResultBadge } from '@/components/dashboard/CandidateCard';
import { NewsCard } from '@/components/news/NewsCard';
import { AgendaLinkCard } from '@/components/gonglon/AgendaLinkCard';
import { SOURCE_KIND_LABELS, type PositionSourceKind } from '@/hooks/useAgendaPositions';
import { STAGE_LABELS, type BillStage } from '@/hooks/useAgendaBills';
import { ListPanel, SectionHeader, Tag, type Tone } from '@/components/ds';
import { ELECTION_RESULT_LABELS, type Candidate } from '@/types/election';

const fmt = (d: string | null | undefined) => (d ? d.slice(0, 10).replace(/-/g, '.') : '');

type TabId = 'profile' | 'gonglon' | 'pledges' | 'news';
const TAB_LABELS: Record<TabId, string> = { profile: '소개', gonglon: '공론에서', pledges: '공약', news: '뉴스' };

/** 예전 후보 주소(/candidate/:id) → 인물 페이지 (?tab=pledges 같은 값은 그대로) */
export function CandidateRedirect() {
  const { id } = useParams();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (params.get('tab') === 'career') params.set('tab', 'profile'); // 경력은 '소개' 탭으로 합쳤다
  const qs = params.toString();
  return <Navigate to={`/politicians/c/${encodeURIComponent(id ?? '')}${qs ? `?${qs}` : ''}`} replace />;
}

/**
 * 인물 페이지 (하나로 통일).
 *  /politicians/m/:code  국회의원 (열린국회정보)
 *  /politicians/c/:key   선거 후보·당선인 (slug 또는 id) — 현직 단체장, 지난 선거 후보 모두
 */
export function PoliticianDetail() {
  const { code, key } = useParams();
  return code ? <MemberPage code={code} /> : <CandidatePage slug={key ?? ''} />;
}

// ─────────────────────────────────────────────────────────────
// 공통 틀
// ─────────────────────────────────────────────────────────────
function Shell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate();
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/politicians'));
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-1 px-2">
          <div className="flex items-center gap-1">
            <button type="button" onClick={back} aria-label="뒤로" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary">
              <ChevronLeft size={22} aria-hidden />
            </button>
            <span className="text-[15px] font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-1">{actions}</div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">{children}</main>
    </div>
  );
}

function ShareButton({ title, text }: { title: string; text: string }) {
  const onShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('링크를 복사했어요');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      try { await navigator.clipboard.writeText(url); toast.success('링크를 복사했어요'); } catch { toast.error('복사하지 못했어요'); }
    }
  }, [title, text]);
  return (
    <button type="button" onClick={onShare} aria-label="공유하기" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary">
      <Share2 size={19} aria-hidden />
    </button>
  );
}

function Hero({ photo, name, tags, lines }: { photo: string | null; name: string; tags: (string | null | undefined)[]; lines: ReactNode[] }) {
  const shownTags = tags.filter((t): t is string => !!t);
  return (
    <section className="flex items-end gap-4">
      <PersonPhotoZoom src={photo} name={name} initial={name.slice(0, 1)} width={120} />
      <div className="min-w-0 flex-1 space-y-2 pb-1">
        {shownTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {shownTags.map((t) => <Tag key={t}>{t}</Tag>)}
          </div>
        )}
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.02em]">{name}</h1>
        {lines.filter(Boolean).map((l, i) => (
          <p key={i} className={cn('leading-snug', i === 0 ? 'text-[13px] text-sub' : 'text-[12px] text-muted-foreground')}>{l}</p>
        ))}
      </div>
    </section>
  );
}

function useTab(tabs: TabId[]) {
  const [params, setParams] = useSearchParams();
  const asked = params.get('tab') as TabId | null;
  const tab = asked && tabs.includes(asked) ? asked : tabs[0];
  const setTab = (t: TabId) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    setParams(next, { replace: true });
  };
  return [tab, setTab] as const;
}

function TabBar({ tabs, tab, onChange }: { tabs: TabId[]; tab: TabId; onChange: (t: TabId) => void }) {
  if (tabs.length < 2) return null;
  return (
    <div role="tablist" aria-label="인물 정보" className="flex border-b border-border">
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          type="button"
          aria-selected={tab === t}
          onClick={() => onChange(t)}
          className={cn(
            '-mb-px h-11 flex-1 border-b-2 px-2 text-[15px] transition-colors',
            tab === t ? 'border-primary font-bold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {TAB_LABELS[t]}
        </button>
      ))}
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <p className="text-[15px] font-semibold">이 사람을 찾지 못했어요</p>
      <p className="text-sm text-muted-foreground">임기가 끝났거나 주소가 바뀌었을 수 있어요.</p>
      <Link to="/politicians?view=all" className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
        정치인 찾아보기
      </Link>
    </div>
  );
}

function Loading() {
  return <div className="h-40 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" role="status" aria-label="불러오는 중" />;
}

// ─────────────────────────────────────────────────────────────
// 국회의원
// ─────────────────────────────────────────────────────────────
function MemberPage({ code }: { code: string }) {
  const members = useAssemblyMembers();
  const member = members.data?.find((m) => m.mona_cd === code);
  const career = useMemberCareer(member?.mona_cd);
  const activity = usePoliticianActivity({ mona: member?.mona_cd });
  const tabs: TabId[] = ['profile', 'gonglon'];
  const [tab, setTab] = useTab(tabs);

  if (members.isLoading) return <Shell title="정치인"><Loading /></Shell>;
  if (!member) return <Shell title="정치인"><NotFound /></Shell>;

  const where = member.elect_type === '비례대표' ? '비례대표' : member.district;
  return (
    <Shell title="정치인" actions={<ShareButton title={`${member.name} 국회의원 | 민심잇다`} text={`${member.name} 국회의원 정보`} />}>
      <Hero
        photo={memberPhotoUrl(member, 'large')}
        name={member.name}
        tags={[member.party, member.reelection]}
        lines={[['국회의원', where].filter(Boolean).join(' · ')]}
      />
      <TabBar tabs={tabs} tab={tab} onChange={setTab} />

      {tab === 'profile' ? (
        <div className="space-y-4">
          <dl className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
            {member.committees.length > 0 && (
              <Row label="위원회">
                {member.committees.join(', ')}
                {member.committee_role && member.committee_role !== '위원' ? ` (${member.committee_role})` : ''}
              </Row>
            )}
            {member.units && <Row label="당선">{member.units}</Row>}
            {member.office && <Row label="의원실">국회 {member.office}</Row>}
            {(member.tel || member.email || member.homepage) && (
              <Row label="연락처">
                <span className="-mt-2 flex flex-wrap gap-x-3">
                  {member.tel && (
                    <a href={`tel:${member.tel}`} className="inline-flex min-h-9 items-center gap-1 text-primary underline">
                      <Phone size={13} aria-hidden /> {member.tel}
                    </a>
                  )}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="inline-flex min-h-9 items-center gap-1 break-all text-primary underline">
                      <Mail size={13} aria-hidden /> {member.email}
                    </a>
                  )}
                  {member.homepage && /^https:\/\//.test(member.homepage) && (
                    <a href={member.homepage} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 text-primary underline">
                      <Globe size={13} aria-hidden /> 홈페이지
                    </a>
                  )}
                </span>
              </Row>
            )}
          </dl>
          {career.data && (
            <details className="group rounded-2xl border border-border bg-card p-4">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[15px] font-semibold">
                <span>
                  약력 <span className="text-xs font-normal text-muted-foreground">의원실이 국회에 낸 내용</span>
                </span>
                <ChevronDown size={18} className="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">{career.data}</p>
            </details>
          )}
        </div>
      ) : (
        <ActivitySection data={activity.data} loading={activity.isLoading} />
      )}

      <p className="text-xs text-muted-foreground">출처: 열린국회정보 국회의원 인적사항·사진 ({fmt(member.synced_at)} 확인)</p>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 선거 후보·당선인 (현직 단체장 포함)
// ─────────────────────────────────────────────────────────────
function CandidatePage({ slug }: { slug: string }) {
  const { data: c, isLoading } = useCandidateBySlug(slug);
  const activity = usePoliticianActivity({ candidateId: c?.id });
  const news = useNewsForCandidate(c?.slug ?? ''); // news_articles.candidate_id = slug
  const schedule = useElectionSchedule();
  const hasPledges = (c?.pledges?.length ?? 0) > 0;
  const hasNews = (news.data?.length ?? 0) > 0;
  const tabs = useMemo<TabId[]>(
    () => ['profile', 'gonglon', ...(hasPledges ? (['pledges'] as TabId[]) : []), ...(hasNews ? (['news'] as TabId[]) : [])],
    [hasPledges, hasNews],
  );
  const [tab, setTab] = useTab(tabs);

  if (isLoading) return <Shell title="정치인"><Loading /></Shell>;
  if (!c) return <Shell title="정치인"><NotFound /></Shell>;

  const elected = c.electionResult === 'elected';
  const electionName = schedule.current?.name ?? '선거';
  const result = c.electionResult ? ` · ${ELECTION_RESULT_LABELS[c.electionResult]}` : '';
  const lines = elected
    ? [c.position, `${electionName} 당선`]
    : [`${electionName} ${c.position} 후보${result}`];

  return (
    <Shell
      title="정치인"
      actions={
        <>
          <FollowButton candidateId={c.id} candidateName={c.name} partyColor={c.partyColor} variant="icon" />
          <ShareButton title={`${c.name} | 민심잇다`} text={c.summary || `${c.name} 정보`} />
        </>
      }
    >
      <Hero photo={headPhotoUrl(c.image ?? null, 480)} name={c.name} tags={[c.party]} lines={lines} />
      <TabBar tabs={tabs} tab={tab} onChange={setTab} />

      {tab === 'profile' && <CandidateProfile c={c} />}
      {tab === 'gonglon' && <ActivitySection data={activity.data} loading={activity.isLoading} />}
      {tab === 'pledges' && <CandidatePledges c={c} electionName={electionName} />}
      {tab === 'news' && (
        <div className="space-y-3">
          {(news.data ?? []).map((article, index) => (
            <NewsCard key={article.id} article={article} index={index} showCandidate={false} />
          ))}
        </div>
      )}
    </Shell>
  );
}

function CandidateProfile({ c }: { c: Candidate }) {
  const careers = c.careers ?? [];
  return (
    <div className="space-y-4">
      {(c.age || c.party || c.education) && (
        <dl className="space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
          {c.party && <Row label="소속">{c.party}</Row>}
          {c.age ? <Row label="나이">{c.age}세</Row> : null}
          {c.education && <Row label="학력">{c.education}</Row>}
        </dl>
      )}
      {c.summary && (
        <section className="space-y-1.5 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[15px] font-semibold">한 줄 소개</h2>
          <p className="text-sm leading-relaxed text-foreground/85">{c.summary}</p>
        </section>
      )}
      {careers.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-[15px] font-semibold">경력</h2>
          <ol className="space-y-3">
            {careers.map((k) => (
              <li key={k.id} className="flex gap-3">
                <Building2 size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  {k.period && <p className="text-xs text-muted-foreground">{k.period}</p>}
                  <p className="text-sm font-semibold">{k.title}</p>
                  {k.organization && <p className="text-sm text-foreground/80">{k.organization}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className="text-xs text-muted-foreground">출처: 후보자 등록 정보 (운영진 입력)</p>
    </div>
  );
}

function CandidatePledges({ c, electionName }: { c: Candidate; electionName: string }) {
  const location = useLocation();
  const gonglon = useGonglonAccess();
  const pledgeIds = useMemo(() => c.pledges?.map((p) => p.id) ?? [], [c]);
  const { data: linked } = useLinkedAgendas({ pledgeIds: gonglon.allowed ? pledgeIds : [] });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{electionName} 공약</span>
        <ElectionResultBadge candidate={c} size="sm" />
      </div>
      {c.slogan && <p className="text-[15px] font-medium text-primary">"{c.slogan}"</p>}
      <ol className="space-y-3">
        {(c.pledges ?? []).map((p, i) => (
          <li key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold">{i + 1}</span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{p.title}</h3>
                {p.category && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{p.category}</span>}
              </div>
              {p.description && <p className="text-sm leading-relaxed text-foreground/85">{p.description}</p>}
              {linked?.get(p.id)?.map((agenda) => (
                <AgendaLinkCard
                  key={agenda.agenda_id}
                  agenda={agenda}
                  from={{ label: `${c.name}의 공약 ‘${p.title}’에서 왔어요`, path: `${location.pathname}?tab=pledges` }}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/** 공론에서: 이 사람의 입장, 대표발의한 연결 법안, 연결 법안 표결 */
function ActivitySection({ data, loading }: { data?: PoliticianActivity; loading: boolean }) {
  const positions = data?.positions ?? [];
  const sponsored = data?.sponsored ?? [];
  const votes = data?.votes ?? [];
  const empty = positions.length + sponsored.length + votes.length === 0;

  return (
    <section aria-labelledby="activity-title" className="space-y-6">
      <h2 id="activity-title" className="sr-only">공론에서</h2>
      {loading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
      ) : empty ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm leading-relaxed text-muted-foreground">
          아직 공론 의제와 연결된 발언이나 법안이 없어요. 생기면 여기에 모여요.
        </p>
      ) : (
        <>
          {positions.length > 0 && (
            <div className="space-y-2.5">
              <SectionHeader title="공론 의제에 대한 입장" sub="운영진이 공개 발언·보도자료에서 찾아 출처와 함께 적었어요. 찬반으로 나누지 않아요." />
              <ul className="space-y-2.5">
                {positions.map((p, i) => (
                  <li key={`p-${i}`} className="space-y-2 rounded-2xl border border-border bg-card p-4">
                    <AgendaLink id={p.agenda_id} title={p.agenda_title} />
                    <p className="text-[15px] leading-relaxed">“{p.summary}”</p>
                    <p className="text-[12px] text-muted-foreground">
                      {fmt(p.spoken_on)} · {SOURCE_KIND_LABELS[p.source_kind as PositionSourceKind] ?? p.source_kind}{' '}
                      <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:text-primary-strong">
                        원문 ›
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sponsored.length + votes.length > 0 && (
            <div className="space-y-2.5">
              <SectionHeader title="관련 법안" />
              <ListPanel>
                {sponsored.map((b) => (
                  <div key={`s-${b.bill_id}-${b.agenda_id}`} className="space-y-1.5 px-4 py-3.5">
                    <AgendaLink id={b.agenda_id} title={b.agenda_title} />
                    <p className="text-[15px] font-semibold leading-snug">{b.bill_name}</p>
                    <p className="flex flex-wrap items-center gap-1.5">
                      <Tag tone="info">대표 발의</Tag>
                      <Tag tone={stageTone(b.stage)}>{STAGE_LABELS[b.stage as BillStage] ?? b.stage}</Tag>
                      <span className="text-[12px] text-muted-foreground">{fmt(b.propose_dt)} 발의</span>
                    </p>
                  </div>
                ))}
                {votes.map((v) => (
                  <div key={`v-${v.bill_id}-${v.agenda_id}`} className="space-y-1.5 px-4 py-3.5">
                    <AgendaLink id={v.agenda_id} title={v.agenda_title} />
                    <p className="text-[15px] font-semibold leading-snug">{v.bill_name}</p>
                    <p className="flex flex-wrap items-center gap-1.5">
                      <Tag>본회의 표결 · {v.vote}</Tag>
                      {v.vote_date && <span className="text-[12px] text-muted-foreground">{fmt(v.vote_date)}</span>}
                    </p>
                  </div>
                ))}
              </ListPanel>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** 법안 단계 색: 본회의 통과 이후는 초록, 나머지(심사 중·폐기 등)는 회색 */
function stageTone(stage: string): Tone {
  return ['plenary_passed', 'transferred', 'promulgated'].includes(stage) ? 'agree' : 'neutral';
}

function AgendaLink({ id, title }: { id: string; title: string }) {
  return (
    <Link to={`/gonglon/${id}`} className="block text-[12px] text-muted-foreground hover:text-primary">
      공론 · {title}
    </Link>
  );
}
