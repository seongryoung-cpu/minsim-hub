import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHOICE_LABELS, useCastAgendaVote, type AgendaChoice, type LinkedAgenda } from '@/hooks/useAgendas';
import { VoteChoiceButtons } from './VoteChoiceButtons';
import { useLoginPrompt } from './useLoginPrompt';

export interface AgendaFrom {
  /** 의제 상세 상단 띠에 보일 문구 (예: "홍길동 후보의 공약 '청년 월세 지원'에서 왔어요") */
  label: string;
  /** '돌아가기'로 돌아올 경로 */
  path: string;
}

interface AgendaLinkCardProps {
  agenda: LinkedAgenda;
  from: AgendaFrom;
}

/**
 * 후보 공약 화면의 연결 카드 (첫 반응형, B안).
 * - 진행 중: 카드에서 첫 반응(동의·비동의·유보)을 받고, 의제 상세에서 쟁점을 읽은 뒤 최종 의견을 받는다.
 * - 선거 기간 조용한 모드: 반응 버튼 없이 참여자 수와 '의제 보기'만.
 * - 마감: 의제 보기로만 안내 ('결과' 문구는 후보 화면에 쓰지 않음).
 * 의견 분포(%)는 이 카드에 절대 보이지 않는다.
 */
export function AgendaLinkCard({ agenda, from }: AgendaLinkCardProps) {
  const vote = useCastAgendaVote();
  const { handleError, loginModal } = useLoginPrompt();
  const [rechoosing, setRechoosing] = useState(false);
  const to = `/gonglon/${agenda.agenda_id}`;
  const state = { from };

  const choose = (choice: AgendaChoice) => {
    vote.mutate(
      { agendaId: agenda.agenda_id, stage: 'first', choice, source: 'pledge_card' },
      { onSuccess: () => setRechoosing(false), onError: handleError },
    );
  };

  const closed = agenda.status === 'closed';
  const quiet = agenda.quiet_mode && !closed;
  const showButtons = !closed && !quiet && !agenda.my_final && (!agenda.my_first || rechoosing);

  return (
    <section
      aria-label="관련 시민 공론"
      className={cn(
        'mt-4 rounded-xl border-[1.5px] p-3.5 space-y-2.5',
        closed ? 'border-border bg-card' : quiet ? 'border-accent bg-card' : 'border-accent bg-accent/[0.07]',
      )}
    >
      <div className="flex items-center gap-1.5 text-xs">
        {closed ? (
          <span className="rounded-md bg-secondary px-2 py-0.5 font-bold text-muted-foreground">마감</span>
        ) : (
          <MessagesSquare size={15} className="text-accent" aria-hidden />
        )}
        <span className={cn('font-bold', closed ? 'text-muted-foreground' : 'text-accent')}>
          {closed ? '마감된 시민 공론' : '관련 시민 공론'}
        </span>
        <span className="ml-auto text-muted-foreground">참여 {agenda.participants.toLocaleString()}명</span>
      </div>

      <p className="text-[15px] font-semibold leading-snug text-foreground">{agenda.title}</p>

      {closed ? (
        <Link to={to} state={state} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-primary">
          의제 보기 <ChevronRight size={15} aria-hidden />
        </Link>
      ) : quiet ? (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">선거 기간에는 후보 화면에서 반응을 받지 않아요. 의제 화면에서 참여해 주세요.</p>
          <Link to={to} state={state} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-accent">
            의제 보기 <ChevronRight size={15} aria-hidden />
          </Link>
        </>
      ) : showButtons ? (
        <>
          <p className="text-[13px] text-foreground/80">이 방향에 대해 어떻게 생각하세요?</p>
          <VoteChoiceButtons
            label="첫 반응"
            value={rechoosing ? (agenda.my_first as AgendaChoice | null) : null}
            onChoose={choose}
            disabled={vote.isPending}
            size="md"
            tone="warm"
          />
          <Link to={to} state={state} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-accent">
            쟁점 먼저 보기 <ChevronRight size={15} aria-hidden />
          </Link>
        </>
      ) : agenda.my_final ? (
        <>
          <p className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
            <Check size={15} className="text-primary" aria-hidden />
            최종 의견을 남겼어요 · {CHOICE_LABELS[agenda.my_final as AgendaChoice]}
          </p>
          <Link to={to} state={state} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-accent">
            의제 보기 <ChevronRight size={15} aria-hidden />
          </Link>
        </>
      ) : (
        <>
          <p className="flex items-center gap-1 text-[13px] font-semibold text-foreground">
            <Check size={15} className="text-accent" aria-hidden />
            첫 반응을 남겼어요 · {CHOICE_LABELS[agenda.my_first as AgendaChoice]}
          </p>
          <Link
            to={to}
            state={state}
            className="flex h-11 items-center justify-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-foreground"
          >
            쟁점 보고 최종 의견 남기기
          </Link>
          <button
            type="button"
            onClick={() => setRechoosing(true)}
            className="h-9 rounded-full border border-border bg-card px-3 text-xs text-foreground/80"
          >
            다시 고르기
          </button>
        </>
      )}
      {loginModal}
    </section>
  );
}
