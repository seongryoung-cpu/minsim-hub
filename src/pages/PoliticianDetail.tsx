import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ExternalLink, Globe, Mail, Phone } from 'lucide-react';
import { headPhotoUrl, memberPhotoUrl, useAssemblyMembers, useMetroHeads, usePoliticianActivity, type PoliticianActivity } from '@/hooks/usePoliticians';
import { PersonPhoto } from '@/components/politicians/PersonPhoto';
import { candidatePath } from '@/hooks/useCandidates';
import { SOURCE_KIND_LABELS, type PositionSourceKind } from '@/hooks/useAgendaPositions';
import { STAGE_LABELS, type BillStage } from '@/hooks/useAgendaBills';

const fmt = (d: string | null | undefined) => (d ? d.slice(0, 10).replace(/-/g, '.') : '');

/** 인물 페이지. /politicians/m/:code (국회의원) · /politicians/c/:id (광역단체장) */
export function PoliticianDetail() {
  const { code, id } = useParams();
  const navigate = useNavigate();
  const members = useAssemblyMembers();
  const heads = useMetroHeads();
  const member = code ? members.data?.find((m) => m.mona_cd === code) : undefined;
  const head = id ? heads.data?.find((h) => h.id === id) : undefined;
  const activity = usePoliticianActivity({ mona: member?.mona_cd, candidateId: head?.id });
  const loading = code ? members.isLoading : heads.isLoading;

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/politicians'));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-2">
          <button type="button" onClick={back} aria-label="뒤로" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary">
            <ChevronLeft size={22} aria-hidden />
          </button>
          <span className="text-[15px] font-semibold">정치인</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 pt-5">
        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" role="status" aria-label="불러오는 중" />
        ) : member ? (
          <>
            <section className="flex items-center gap-4">
              <PersonPhoto src={memberPhotoUrl(member, 240)} initial={member.name.slice(0, 1)} size={80} />
              <div className="min-w-0 space-y-1.5">
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <p className="text-[15px] text-foreground/80">
                {['국회의원', member.elect_type === '비례대표' ? '비례대표' : member.district, member.party, member.reelection].filter(Boolean).join(' · ')}
              </p>
              </div>
            </section>

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

            <ActivitySection data={activity.data} loading={activity.isLoading} />

            {member.career && (
              <details className="group rounded-2xl border border-border bg-card p-4">
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[15px] font-semibold">
                  <span>
                    약력 <span className="text-xs font-normal text-muted-foreground">의원실이 국회에 낸 내용</span>
                  </span>
                  <ChevronDown size={18} className="text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">{member.career}</p>
              </details>
            )}

            <p className="text-xs text-muted-foreground">출처: 열린국회정보 국회의원 인적사항·사진 ({fmt(member.synced_at)} 확인)</p>
          </>
        ) : head ? (
          <>
            <section className="flex items-center gap-4">
              <PersonPhoto src={headPhotoUrl(head.image_url, 240)} initial={head.name.slice(0, 1)} size={80} />
              <div className="min-w-0 space-y-1.5">
                <h1 className="text-2xl font-bold">{head.name}</h1>
                <p className="text-[15px] text-foreground/80">{[head.position, head.party].filter(Boolean).join(' · ')}</p>
              </div>
            </section>

            <Link
              to={candidatePath(head)}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 hover:bg-secondary/50"
            >
              <span>
                <span className="block text-[15px] font-semibold">공약과 경력 보기</span>
                <span className="block text-xs text-muted-foreground">2026 지방선거 당선인 공약</span>
              </span>
              <ExternalLink size={16} className="text-muted-foreground" aria-hidden />
            </Link>

            <ActivitySection data={activity.data} loading={activity.isLoading} />
          </>
        ) : (
          <div className="space-y-3 py-16 text-center">
            <p className="text-[15px] font-semibold">이 사람을 찾지 못했어요</p>
            <p className="text-sm text-muted-foreground">임기가 끝났거나 주소가 바뀌었을 수 있어요.</p>
            <Link to="/politicians?view=all" className="inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              전체 목록 보기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
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
    <section aria-labelledby="activity-title" className="space-y-3">
      <h2 id="activity-title" className="text-[17px] font-bold">공론에서</h2>
      {loading ? (
        <div className="h-20 animate-pulse rounded-2xl bg-secondary motion-reduce:animate-none" />
      ) : empty ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm leading-relaxed text-muted-foreground">
          아직 공론 의제와 연결된 발언이나 법안이 없어요. 생기면 여기에 모여요.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {positions.map((p, i) => (
            <li key={`p-${i}`} className="space-y-1.5 rounded-2xl border border-border bg-card p-4">
              <AgendaLink id={p.agenda_id} title={p.agenda_title} />
              <p className="text-sm leading-relaxed">{p.summary}</p>
              <p className="text-xs text-muted-foreground">
                {fmt(p.spoken_on)} · {SOURCE_KIND_LABELS[p.source_kind as PositionSourceKind] ?? p.source_kind}{' '}
                <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  원문
                </a>
              </p>
            </li>
          ))}
          {sponsored.map((b) => (
            <li key={`s-${b.bill_id}-${b.agenda_id}`} className="space-y-1.5 rounded-2xl border border-border bg-card p-4">
              <AgendaLink id={b.agenda_id} title={b.agenda_title} />
              <p className="text-sm">
                <span className="font-semibold">대표발의</span> · {b.bill_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {fmt(b.propose_dt)} 발의 · 지금 {STAGE_LABELS[b.stage as BillStage] ?? b.stage}
              </p>
            </li>
          ))}
          {votes.map((v) => (
            <li key={`v-${v.bill_id}-${v.agenda_id}`} className="space-y-1.5 rounded-2xl border border-border bg-card p-4">
              <AgendaLink id={v.agenda_id} title={v.agenda_title} />
              <p className="text-sm">
                본회의 표결 · {v.bill_name}: <strong>{v.vote}</strong>
              </p>
              {v.vote_date && <p className="text-xs text-muted-foreground">{fmt(v.vote_date)}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgendaLink({ id, title }: { id: string; title: string }) {
  return (
    <Link to={`/gonglon/${id}`} className="block text-xs font-semibold text-primary">
      공론 · {title}
    </Link>
  );
}
