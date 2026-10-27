import { Link } from 'react-router-dom';
import { CHOICE_LABELS, useAgendaList, useGonglonAccess, type AgendaChoice } from '@/hooks/useAgendas';
import { ListPanel, SectionHeader, Tag } from '@/components/ds';

/**
 * 홈 '내가 참여한 공론': 참여한 진행 중 의제와 남은 할 일 (최대 3개).
 * 처음 생각만 남겼으면 '마지막 생각을 아직 안 남겼어요'로 이어서 하게 한다. 참여한 게 없으면 그리지 않는다.
 */
export function MyAgendasCard({ sido }: { sido?: string }) {
  const access = useGonglonAccess();
  const { data } = useAgendaList(sido, access.allowed);
  const mine = (data ?? [])
    .filter((a) => a.my_first || a.my_final)
    // 할 일이 남은 것 → 진행 중 → 마감 순
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 3);
  if (!access.allowed || mine.length === 0) return null;

  return (
    <section aria-labelledby="my-agendas-title" className="space-y-3">
      <SectionHeader id="my-agendas-title" title="내가 참여한 공론" to="/gonglon?tab=mine" action="전체" />
      <ListPanel>
        {mine.map((a) => {
          const first = a.my_first as AgendaChoice | null;
          const final = a.my_final as AgendaChoice | null;
          const needsFinal = a.status === 'open' && !!first && !final;
          return (
            <Link key={a.id} to={`/gonglon/${a.id}`} className="flex flex-col gap-1.5 px-4 py-3.5 hover:bg-secondary/40">
              <span className="text-[15px] font-semibold leading-snug">{a.title}</span>
              <span className="text-[13px] text-sub">
                {first && (
                  <>
                    처음 생각 <strong className="text-primary-strong">{CHOICE_LABELS[first]}</strong>
                  </>
                )}
                {first && final && ' · '}
                {final && (
                  <>
                    마지막 생각 <strong className="text-foreground">{CHOICE_LABELS[final]}</strong>
                  </>
                )}
                {a.status === 'closed' && ' · 마감'}
              </span>
              {needsFinal && <Tag tone="new" className="self-start">마지막 생각을 아직 안 남겼어요</Tag>}
            </Link>
          );
        })}
      </ListPanel>
    </section>
  );
}

function rank(a: { status: string; my_first: string | null; my_final: string | null }) {
  if (a.status === 'open' && a.my_first && !a.my_final) return 0;
  return a.status === 'open' ? 1 : 2;
}
