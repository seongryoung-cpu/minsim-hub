import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CalendarClock } from 'lucide-react';
import { CandidateImage } from '@/components/dashboard/CandidateCard';
import { candidatePath } from '@/hooks/useCandidates';
import { formatDDay, formatYmd, type Candidate } from '@/types/election';
import { useElectionSchedule } from '@/hooks/useElections';

interface ElectedOfficialCardProps {
  /** 이 지역 후보 전체 (결과가 들어 있는) */
  candidates: Candidate[];
  /** 예: 서울시장 */
  officeTitle: string;
  isLoading?: boolean;
}

/**
 * 평상시 모드 홈: 우리 지역 단체장(현직) + 다음 선거.
 * 선거 결과(득표율 등)는 선거 탭에서만 보여 준다 — 홈에서는 '현직 인물'로 다룬다.
 */
export function ElectedOfficialCard({ candidates, officeTitle, isLoading }: ElectedOfficialCardProps) {
  const navigate = useNavigate();
  const winner = candidates.find((c) => c.electionResult === 'elected');
  const { next, nextDDay } = useElectionSchedule();

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className="bg-card rounded-2xl p-4 border border-border"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[17px] font-bold text-foreground">우리 지역 단체장</h2>
        <button
          type="button"
          onClick={() => navigate('/politicians?view=election')}
          className="text-[13px] font-semibold text-muted-foreground hover:text-foreground"
        >
          지난 선거 결과 보기
        </button>
      </div>

      {isLoading ? (
        <div className="h-20 rounded-xl bg-secondary animate-pulse" />
      ) : winner ? (
        <>
          <button
            type="button"
            onClick={() => navigate(candidatePath(winner))}
            className="w-full flex items-center gap-3 text-left rounded-xl p-2 -mx-2 hover:bg-secondary/50 transition-colors"
          >
            <div
              className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: `${winner.partyColor}18` }}
            >
              <CandidateImage
                src={winner.image}
                alt={winner.name}
                partyColor={winner.partyColor}
                size="md"
                className="w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-foreground">{winner.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: `${winner.partyColor}20`, color: winner.partyColor }}
                >
                  {winner.party}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{officeTitle} · 공약과 경력 보기</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </button>

        </>
      ) : (
        <p className="text-sm text-muted-foreground py-3">이 지역 단체장 정보는 아직 준비 중이에요.</p>
      )}

      {next && nextDDay != null && (
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarClock size={14} />
          <span>다음 선거 · {next.name} ({formatYmd(next.election_date)})</span>
          <span className="ml-auto font-semibold text-primary">{formatDDay(nextDDay)}</span>
        </div>
      )}
    </motion.section>
  );
}
