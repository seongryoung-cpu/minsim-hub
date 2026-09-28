import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CalendarClock } from 'lucide-react';
import { CandidateImage } from '@/components/dashboard/CandidateCard';
import { candidatePath } from '@/hooks/useCandidates';
import {
  CURRENT_ELECTION,
  NEXT_ELECTION,
  calculateDDayTo,
  formatDDay,
  type Candidate,
} from '@/types/election';

interface ElectedOfficialCardProps {
  /** 이 지역 후보 전체 (결과가 들어 있는) */
  candidates: Candidate[];
  /** 예: 서울시장 */
  officeTitle: string;
  isLoading?: boolean;
}

/** 평상시 모드 홈: 우리 지역 당선인 + 본선 결과 + 다음 선거 */
export function ElectedOfficialCard({ candidates, officeTitle, isLoading }: ElectedOfficialCardProps) {
  const navigate = useNavigate();
  const winner = candidates.find((c) => c.electionResult === 'elected');
  const finalists = candidates
    .filter((c) => (c.electionResult === 'elected' || c.electionResult === 'defeated') && c.voteShare != null)
    .sort((a, b) => (b.voteShare ?? 0) - (a.voteShare ?? 0));
  const nextDDay = calculateDDayTo(NEXT_ELECTION.date);

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className="bg-card rounded-2xl p-4 shadow-sm border border-border/50"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">우리 지역 {officeTitle}</h2>
        <span className="text-xs text-muted-foreground">{CURRENT_ELECTION.name} 결과</span>
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
              style={{ background: `linear-gradient(145deg, ${winner.partyColor}25, ${winner.partyColor}10)` }}
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
              <p className="text-xs text-muted-foreground">{officeTitle} 당선인 · 공약과 경력 보기</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground flex-shrink-0" />
          </button>

          {finalists.length > 1 && (
            <div className="mt-3 space-y-1.5">
              {finalists.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <span className="w-12 flex-shrink-0 truncate text-foreground">{c.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.voteShare}%`, backgroundColor: c.partyColor }}
                    />
                  </div>
                  <span className="w-14 text-right tabular-nums text-muted-foreground">{c.voteShare!.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground py-3">이 지역의 선거 결과는 아직 준비 중이에요.</p>
      )}

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarClock size={14} />
        <span>다음 선거 · {NEXT_ELECTION.name} ({NEXT_ELECTION.date.replace(/-/g, '.')})</span>
        <span className="ml-auto font-semibold text-primary">{formatDDay(nextDDay)}</span>
      </div>
    </motion.section>
  );
}
