import { Bell, BellRing, CircleHelp, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRegion } from '@/hooks/useRegion';
import {
  ENDED_STAGES,
  STAGE_LABELS,
  STAGE_PATH,
  TERM_END,
  daysBetween,
  todayKst,
  useAgendaBills,
  useLocalDistricts,
  useToggleBillAlert,
  type AgendaBill,
} from '@/hooks/useAgendaBills';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * 공론 상세 '관련 법안'.
 * 국회 기록을 그대로 보여 준다: 판단하는 말(방치 등)은 쓰지 않고, 날짜와 단계만.
 * 출처: 열린국회정보 (이용약관 제7조)
 */
export function AgendaBillsSection({ agendaId }: { agendaId: string }) {
  const { region } = useRegion();
  const { data: districts = [] } = useLocalDistricts(region);
  const { data: bills } = useAgendaBills(agendaId, districts);
  const { requireLogin, handleError, loginModal } = useLoginPrompt();
  const toggle = useToggleBillAlert(agendaId);

  if (!bills || bills.length === 0) return null;
  const lastSync = bills.map((b) => b.synced_at).sort().at(-1);

  const onAlert = (b: AgendaBill) =>
    requireLogin('alert', () =>
      toggle.mutate(b.bill_id, {
        onSuccess: (on) => toast.success(on ? '결말이 나면 알려 드릴게요' : '알림을 껐어요'),
        onError: (e) => (e instanceof Error && e.message === 'login_required' ? undefined : handleError(e)),
      }),
    );

  return (
    <section aria-labelledby="bills-title" className="space-y-2.5">
      <div className="flex items-center gap-1">
        <h2 id="bills-title" className="text-[17px] font-bold">
          관련 법안
        </h2>
        <Popover>
          <PopoverTrigger
            aria-label="이 정보는 어디서 오나요?"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <CircleHelp size={17} aria-hidden />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-2 text-[13px] leading-relaxed">
            <p className="font-semibold text-foreground">국회 기록을 매일 아침 확인해요</p>
            <p className="text-muted-foreground">
              진행 단계와 표결은 국회 의안정보를 그대로 보여 줘요. "무엇이 바뀌나"는 운영진이 법안 원문을 읽고 쉬운 말로 옮긴 거예요.
              정확한 내용은 원문을 확인해 주세요.
            </p>
            <p className="text-muted-foreground">
              국회 임기(2028년 5월 29일)가 끝날 때까지 처리되지 않은 법안은 자동으로 폐기돼요.
            </p>
          </PopoverContent>
        </Popover>
      </div>

      <ul className="space-y-2.5">
        {bills.map((b) => (
          <BillCard key={b.bill_id} bill={b} onAlert={() => onAlert(b)} alertPending={toggle.isPending} />
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        출처: 열린국회정보, 의안정보{lastSync ? `, ${lastSync.slice(0, 10).replace(/-/g, '.')} 확인` : ''}
      </p>
      {loginModal}
    </section>
  );
}

function BillCard({ bill, onAlert, alertPending }: { bill: AgendaBill; onAlert: () => void; alertPending: boolean }) {
  const ended = ENDED_STAGES.includes(bill.stage);
  const today = todayKst();
  const waitingDays = !ended && bill.stage_changed_on ? daysBetween(bill.stage_changed_on, today) : null;
  const termLeft = !ended && bill.stage !== 'transferred' ? daysBetween(today, TERM_END) : null;
  const pathIndex = STAGE_PATH.indexOf(bill.stage === 'transferred' ? 'plenary_passed' : bill.stage);
  const absent = bill.vote ? bill.vote.member_total - bill.vote.total : 0;

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="space-y-1">
        {bill.plain?.what ? (
          <>
            <p className="text-[15px] font-semibold leading-snug">{bill.plain.what}</p>
            <p className="text-xs text-muted-foreground">{bill.bill_name}</p>
          </>
        ) : (
          <p className="text-[15px] font-semibold leading-snug">{bill.bill_name}</p>
        )}
      </div>

      {(bill.plain?.who || bill.plain?.when) && (
        <dl className="grid gap-1 text-[13px]">
          {bill.plain?.who && (
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">누가</dt>
              <dd>{bill.plain.who}</dd>
            </div>
          )}
          {bill.plain?.when && (
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">언제부터</dt>
              <dd>{bill.plain.when}</dd>
            </div>
          )}
        </dl>
      )}

      {/* 진행 단계 */}
      <div className="space-y-1.5">
        {ended && bill.stage !== 'promulgated' ? (
          <p className="text-sm font-semibold">
            결말 · {STAGE_LABELS[bill.stage]}
            {bill.stage_changed_on && <span className="ml-1 font-normal text-muted-foreground">({bill.stage_changed_on.replace(/-/g, '.')})</span>}
          </p>
        ) : (
          <>
            <ol className="flex gap-1" aria-label="진행 단계">
              {STAGE_PATH.map((s, i) => (
                <li
                  key={s}
                  aria-current={i === pathIndex ? 'step' : undefined}
                  className={cn('h-1.5 flex-1 rounded-full', i <= pathIndex ? 'bg-primary' : 'bg-secondary')}
                >
                  <span className="sr-only">{STAGE_LABELS[s]}{i <= pathIndex ? ' (지남)' : ''}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm">
              <span className="font-semibold">지금: {STAGE_LABELS[bill.stage]}</span>
              {waitingDays != null && waitingDays > 0 && <span className="text-muted-foreground"> · {waitingDays}일째</span>}
            </p>
          </>
        )}
        {termLeft != null && termLeft >= 0 && (
          <p className="text-xs text-muted-foreground">국회 임기 종료까지 D-{termLeft} · 그때까지 처리되지 않으면 자동 폐기돼요</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {bill.proposer ?? '발의자 정보 없음'}
        {bill.committee ? ` · 소관 ${bill.committee}` : ''}
        {bill.propose_dt ? ` · ${bill.propose_dt.replace(/-/g, '.')} 발의` : ''}
      </p>

      {bill.vote && (
        <div className="space-y-1.5 rounded-xl bg-secondary/50 p-3 text-[13px]">
          <p className="font-semibold">
            본회의 표결{bill.vote.date ? ` (${bill.vote.date.replace(/-/g, '.')})` : ''}
          </p>
          <p>
            찬성 {bill.vote.yes} · 반대 {bill.vote.no} · 기권 {bill.vote.blank}
            {absent > 0 && ` · 불참 ${absent}`}
          </p>
          {bill.local_votes.length > 0 && (
            <ul className="space-y-0.5 border-t border-border pt-1.5">
              {bill.local_votes.map((v) => (
                <li key={`${v.district}-${v.name}`}>
                  <span className="text-muted-foreground">우리 지역 · {v.district}</span> {v.name}
                  {v.party ? ` (${v.party})` : ''}: <strong>{v.vote}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!ended && (
          <button
            type="button"
            aria-pressed={bill.my_alert}
            disabled={alertPending}
            onClick={onAlert}
            className={cn(
              'flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
              bill.my_alert ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground/80 hover:bg-secondary',
            )}
          >
            {bill.my_alert ? <BellRing size={15} aria-hidden /> : <Bell size={15} aria-hidden />}
            {bill.my_alert ? '결말 알림 받는 중' : '결말 알림 받기'}
          </button>
        )}
        {bill.detail_link && (
          <a
            href={bill.detail_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1 px-1 text-xs text-primary underline"
          >
            법안 원문 보기 <ExternalLink size={12} aria-hidden />
          </a>
        )}
      </div>
    </li>
  );
}
