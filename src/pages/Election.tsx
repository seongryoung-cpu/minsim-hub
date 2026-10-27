import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vote, Users, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ListPanel, Panel, SectionHeader, Tag } from '@/components/ds';
import { PersonPhoto } from '@/components/politicians/PersonPhoto';
import { headPhotoUrl } from '@/hooks/usePoliticians';
import type { Candidate } from '@/types/election';
import { ElectionTimeline } from '@/components/dashboard/ElectionTimeline';
import { CandidateCard, CandidateCardSkeleton } from '@/components/dashboard/CandidateCard';
import { useRegion } from '@/hooks/useRegion';
import { useCandidates, candidatePath } from '@/hooks/useCandidates';
import { formatDDay, formatYmd, getMetropolitanTitle, sortByElectionResult } from '@/types/election';
import { useElectionSchedule } from '@/hooks/useElections';
import { useAppMode } from '@/hooks/useAppMode';
import { AppModePending } from '@/components/dashboard/AppModePending';
import { PolicyMatchBanner } from '@/components/dashboard/PolicyMatchBanner';

/** embedded: 정치인 탭의 '선거' 보기로 들어갈 때 (머리글 없이) */
export function Election({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const { region } = useRegion();
  
  // Fetch candidates from DB
  const { data: candidates, isLoading: isCandidatesLoading } = useCandidates(region?.sido);
  const appMode = useAppMode();
  const isNormal = appMode.mode === 'normal';
  const [showOthers, setShowOthers] = useState(false);
  const schedule = useElectionSchedule();

  const electionStatus = useMemo(() => {
    if (!region) return null;
    
    const regionName = region.sido;
    return {
      regionName,
      dDay: schedule.dDay,
      isOver: schedule.isOver,
      nextDDay: schedule.nextDDay,
      milestones: schedule.milestones,
      candidates: isNormal ? sortByElectionResult(candidates || []) : candidates || [],
      title: getMetropolitanTitle(regionName),
    };
  }, [region, candidates, isNormal, schedule.dDay, schedule.isOver, schedule.nextDDay, schedule.milestones]);

  const finalists = electionStatus?.candidates.filter(
    (c) => c.electionResult === 'elected' || c.electionResult === 'defeated',
  ) ?? [];
  const others = electionStatus?.candidates.filter(
    (c) => c.electionResult !== 'elected' && c.electionResult !== 'defeated',
  ) ?? [];
  // 평상시인데 결과가 아직 없으면 후보 전체를 그대로 보여 준다
  const showResults = isNormal && finalists.length > 0;

  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  if (!electionStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">지역을 선택해주세요</div>
      </div>
    );
  }

  if (appMode.mode === null) {
    return <AppModePending isError={appMode.isError} onRetry={appMode.retry} />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={embedded ? 'bg-background' : 'min-h-screen bg-background pb-20'}
    >
      {!embedded && (
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Vote size={22} className="text-primary" />
            <h1 className="font-semibold text-lg text-foreground">선거</h1>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>{region?.sigungu}</span>
          </div>
        </div>
      </header>
      )}

      <main className={embedded ? 'mx-auto max-w-2xl p-4 space-y-5' : 'p-4 space-y-5'}>
        {/* 선거 카드: 끝났으면 다음 선거, 아니면 이번 선거 + 진행 단계 */}
        <ElectionCard schedule={schedule} />

        {showResults ? (
          <section aria-labelledby="results-title" className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="results-title" className="text-[17px] font-bold tracking-[-0.01em]">지난 선거 결과</h2>
              <span className="text-[12px] text-muted-foreground">
                {[schedule.current?.name, electionStatus.title].filter(Boolean).join(' · ')}
              </span>
            </div>
            <ListPanel>
              {finalists.map((c) => <ResultRow key={c.id} c={c} />)}
              {showOthers && others.map((c) => <ResultRow key={c.id} c={c} />)}
              {others.length > 0 && !showOthers && (
                <button
                  type="button"
                  onClick={() => setShowOthers(true)}
                  className="flex min-h-12 w-full items-center justify-center text-[14px] font-semibold text-muted-foreground hover:bg-secondary/50"
                >
                  경선·예비후보 {others.length}명 더 보기
                </button>
              )}
              <Link to="/compare" className="flex min-h-12 items-center justify-center text-[14px] font-semibold text-primary hover:bg-secondary/50">
                후보 공약 비교하기
              </Link>
            </ListPanel>
          </section>
        ) : (
          <>
          {/* Election Timeline */}
          <section className="space-y-2.5">
            <SectionHeader title="선거 진행 단계" />
            <ElectionTimeline milestones={electionStatus.milestones} />
          </section>

          {/* Candidates */}
          <section className="space-y-2.5">
            <SectionHeader title="후보자 현황" to="/compare" action="비교하기" />
            <div className="space-y-3">
              {isCandidatesLoading ? (
                <>
                  <CandidateCardSkeleton />
                  <CandidateCardSkeleton />
                </>
              ) : electionStatus.candidates.length > 0 ? (
                electionStatus.candidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    index={index}
                    onPress={() => navigate(candidatePath(candidate))}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">등록된 후보자가 없습니다</p>
                </div>
              )}
            </div>
          </section>
          </>
        )}

        {/* 정책 매칭 (후보 공약 기반이라 평상시에는 홈이 아니라 여기서만) */}
        <PolicyMatchBanner onPress={() => navigate('/policy-match')} />

        {/* 투표소·체크리스트는 선거 기간에만 */}
        {!isNormal && (
          <>
            {/* Polling Station Finder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border bg-card p-[18px]"
            >
              <div className="mb-4">
                <h3 className="text-[17px] font-bold">투표소 찾기</h3>
                <p className="text-[13px] text-muted-foreground">내 투표소 위치를 확인하세요</p>
              </div>
          
              <div className="space-y-3">
                {schedule.voting.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">등록된 투표 일정이 없어요</p>
                )}
                {schedule.voting.map((v, i) => (
                  <motion.a
                    key={v.id}
                    href={v.link_url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-4 bg-secondary rounded-xl hover:bg-secondary/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                        {i === 0 ? <MapPin size={16} /> : <Vote size={16} />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{v.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatYmd(v.start_date)}{v.end_date ? ` ~ ${formatYmd(v.end_date).slice(5)}` : ''}
                        </p>
                      </div>
                    </div>
                    {v.link_url && <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />}
                  </motion.a>
                ))}
              </div>

              <p className="text-xs text-muted-foreground text-center mt-4">
                중앙선거관리위원회 공식 사이트로 연결됩니다
              </p>
            </motion.div>

            {/* Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-border bg-card p-[18px]"
            >
              <h3 className="mb-3 text-[17px] font-bold">선거 준비 체크리스트</h3>
              <ul className="space-y-3">
                {schedule.checklist.map((row, i) => (
                  <motion.li
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </div>
                    {row.title}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </main>
    </motion.div>
  );
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
function longDate(ymd: string | null | undefined) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const w = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${w})`;
}

/** 선거 카드: 지난 선거가 끝났으면 '다음 선거 · D-n', 아니면 이번 선거 D-day와 진행 단계 날짜 */
function ElectionCard({ schedule }: { schedule: ReturnType<typeof useElectionSchedule> }) {
  if (schedule.isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />;
  const showNext = schedule.isOver && !!schedule.next;
  const e = showNext ? schedule.next : schedule.current;
  const d = showNext ? schedule.nextDDay : schedule.dDay;
  if (!e) {
    return (
      <Panel className="p-[18px] text-[14px] text-muted-foreground">선거 일정이 아직 등록되지 않았어요.</Panel>
    );
  }
  const rows = showNext ? [] : schedule.milestones.filter((m) => m.date);
  return (
    <Panel className="space-y-2.5 p-[18px]">
      <Tag tone="info">
        {showNext ? '다음 선거' : schedule.isOver ? '지난 선거' : '이번 선거'}
        {d != null && d >= 0 ? ` · ${formatDDay(d)}` : schedule.isOver && !showNext ? ' · 종료' : ''}
      </Tag>
      <h2 className="text-[20px] font-bold tracking-[-0.02em]">{e.name}</h2>
      <p className="text-[14px] text-sub">{longDate(e.election_date)}</p>
      {rows.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          {rows.map((m) => (
            <div key={m.id} className="flex justify-between gap-3 text-[14px]">
              <span className={m.isCurrent ? 'font-semibold' : 'text-sub'}>{m.label}</span>
              <span className="text-muted-foreground">{formatYmd(m.date)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[12px] text-muted-foreground">
        {showNext ? '세부 일정은 선관위 발표가 나면 여기에 올려요.' : '일정은 선관위 발표에 따라 바뀔 수 있어요.'}
      </p>
    </Panel>
  );
}

/** 지난 선거 결과 한 줄: 사진 · 이름 · 정당 · 득표율 · 당선/낙선 */
function ResultRow({ c }: { c: Candidate }) {
  const tag = c.electionResult === 'elected' ? <Tag tone="info">당선</Tag> : c.electionResult === 'defeated' ? <Tag>낙선</Tag> : <Tag>경선·예비</Tag>;
  return (
    <Link to={candidatePath(c)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50">
      <PersonPhoto src={headPhotoUrl(c.image ?? null, 120)} initial={c.name.slice(0, 1)} width={40} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-[15px] font-bold">{c.name}</span>
          {c.party && <span className="text-[12px] font-semibold text-muted-foreground">{c.party}</span>}
        </span>
        {c.voteShare != null && <span className="block text-[13px] text-muted-foreground">득표율 {c.voteShare.toFixed(1)}%</span>}
      </span>
      {tag}
    </Link>
  );
}
