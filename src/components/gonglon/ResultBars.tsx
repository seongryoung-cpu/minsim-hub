import { CHOICE_LABELS, type AgendaChoice, type AgendaSummary } from '@/hooks/useAgendas';
import { CHOICE_BAR } from './choiceStyles';

const CHOICES: AgendaChoice[] = ['agree', 'disagree', 'hold'];

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

/**
 * 최종 의견 분포 + 숙의 전후 변화.
 * summary.revealed 가 true 일 때만 그린다 (서버가 조건을 판단: 최종 의견 제출 또는 마감, 참여 5명 이상).
 */
export function ResultBars({ summary }: { summary: AgendaSummary }) {
  if (!summary.revealed || !summary.distribution) return null;
  const final = summary.distribution.final;
  const total = final.agree + final.disagree + final.hold;

  // 첫 반응과 최종 의견을 모두 낸 사람 중 선택을 바꾼 비율
  const shiftEntries = Object.entries(summary.shift ?? {});
  const both = shiftEntries.reduce((sum, [, n]) => sum + n, 0);
  const changed = shiftEntries
    .filter(([key]) => {
      const [a, b] = key.split('>');
      return a !== b;
    })
    .reduce((sum, [, n]) => sum + n, 0);

  return (
    <div className="space-y-2.5">
      {CHOICES.map((choice) => {
        const p = pct(final[choice], total);
        return (
          <div key={choice} className="flex items-center gap-2.5 text-[13px]">
            <span className="w-11 text-foreground/80">{CHOICE_LABELS[choice]}</span>
            <span
              className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden"
              role="img"
              aria-label={`${CHOICE_LABELS[choice]} ${p}%`}
            >
              <span className={`block h-full rounded-full ${CHOICE_BAR[choice]}`} style={{ width: `${p}%` }} />
            </span>
            <span className="w-10 text-right tabular-nums text-muted-foreground">{p}%</span>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        최종 의견 {total.toLocaleString()}명 기준
        {both > 0 && ` · 첫 반응에서 생각이 바뀐 사람 ${pct(changed, both)}%`}
      </p>
    </div>
  );
}
