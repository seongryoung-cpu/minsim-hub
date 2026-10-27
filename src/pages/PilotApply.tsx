import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, ChevronDown, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tag } from '@/components/ds';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLoginPrompt } from '@/components/gonglon/useLoginPrompt';
import { QuickParticipate } from '@/components/gonglon/QuickParticipate';
import { useAgenda } from '@/hooks/useAgendas';
import {
  GRADE_OPTIONS,
  HEARD_FROM_OPTIONS,
  PILOT_ERROR_TEXT,
  PILOT_STATUS_LABELS,
  PilotError,
  formatPhone,
  isValidPhone,
  useApplyPilot,
  useCancelPilot,
  useMyPilotApplication,
  usePilotApplicationCount,
  usePilotEvent,
  type MyPilotApplication,
  type PilotApplyInput,
  type PilotEvent,
} from '@/hooks/usePilot';

const OTHER_SCHOOL = '__other__';
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 12월 5일 (토) 오후 1:00 */
function formatWhen(iso: string, withTime = true) {
  const d = new Date(iso);
  const date = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
  if (!withTime) return date;
  const h = d.getHours();
  const m = d.getMinutes();
  return `${date} ${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, '0')}` : '시'}`;
}

const EMPTY: PilotApplyInput = {
  name: '',
  phone: '',
  isStudent: true,
  school: '',
  major: '',
  grade: '',
  heardFrom: '',
  consentPrivacy: false,
  consentPhoto: false,
};

/**
 * 오프라인 행사 참가 신청 화면 (/pilot/:slug)
 * 행사 안내 → 신청서 → 신청 완료(상태 · 사전 의견 남기기 · 고치기 · 취소)
 */
export function PilotApply() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { data: ev, isLoading } = usePilotEvent(slug);
  const { data: count } = usePilotApplicationCount(slug);
  const { data: mine, isLoading: mineLoading } = useMyPilotApplication(ev?.id);
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!ev) {
    return (
      <Shell onBack={() => navigate(-1)}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-bold">행사를 찾을 수 없어요</p>
          <p className="mt-1 text-sm text-muted-foreground">주소를 다시 확인하거나, 받은 안내 링크로 들어와 주세요.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            홈으로
          </Link>
        </div>
      </Shell>
    );
  }

  const closed = Date.now() > new Date(ev.apply_closes_at).getTime();
  const active = mine && mine.status !== 'cancelled' ? mine : null;

  return (
    <Shell onBack={() => navigate(-1)}>
      <EventCard ev={ev} count={count ?? 0} closed={closed} />

      {active && !editing ? (
        <AppliedCard ev={ev} app={active} closed={closed} onEdit={() => setEditing(true)} />
      ) : closed ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="font-bold">신청이 마감됐어요</p>
          <p className="mt-1 text-sm text-muted-foreground">다음 행사 소식은 공론 탭에서 알려 드릴게요.</p>
        </div>
      ) : (
        // 로그인 직후 내 신청을 조회해도 입력값과 로그인 후 이어 할 신청을 유지한다.
        // 기존 신청을 확인하기 전에는 신청서를 보여 주지 않되, 마운트는 유지한다.
        <div hidden={mineLoading}>
          <ApplyForm
            ev={ev}
            initial={mine ?? null}
            onDone={() => setEditing(false)}
            onCancelEdit={active ? () => setEditing(false) : undefined}
          />
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/60 bg-background/95 px-2 backdrop-blur">
        <button type="button" onClick={onBack} aria-label="뒤로" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">행사 참가 신청</h1>
      </header>
      <div className="space-y-4 px-4 pt-4">{children}</div>
    </div>
  );
}

function EventCard({ ev, count, closed }: { ev: PilotEvent; count: number; closed: boolean }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap gap-1.5">
        <Tag tone={closed ? 'neutral' : 'info'}>{closed ? '신청 마감' : `신청 마감 ${formatWhen(ev.apply_closes_at, false)}`}</Tag>
      </div>
      <h2 className="mt-2.5 text-[22px] font-bold leading-snug tracking-[-0.02em]">{ev.title}</h2>
      {ev.summary && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-sub">{ev.summary}</p>}
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <dd>{formatWhen(ev.event_at)}</dd>
        </div>
        {ev.venue && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <dd>{ev.venue}</dd>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <dd>
            {ev.capacity}명 선발 · 지금까지 {count}명 신청
            {ev.announce_at && <span className="text-muted-foreground"> · 결과 안내 {formatWhen(ev.announce_at, false)}</span>}
          </dd>
        </div>
      </dl>
      <p className="mt-4 rounded-xl bg-secondary p-3 text-[12px] leading-relaxed text-sub">
        학교별 인원과 사전 의견이 한쪽으로 몰리지 않게 뽑아요. 먼저 신청한 순서로 뽑지 않아요.
      </p>
    </section>
  );
}

function AppliedCard({ ev, app, closed, onEdit }: { ev: PilotEvent; app: MyPilotApplication; closed: boolean; onEdit: () => void }) {
  const cancel = useCancelPilot(ev.slug);
  const navigate = useNavigate();
  const { data: agendaData } = useAgenda(ev.agenda_id ?? undefined);
  const agenda = agendaData?.agenda;
  const status = app.status;
  const headline =
    status === 'selected'
      ? '선발됐어요. 행사에서 만나요!'
      : status === 'waitlist'
        ? '대기자로 올라 있어요'
        : status === 'declined'
          ? '이번에는 함께하지 못하게 됐어요'
          : '신청했어요';

  return (
    <>
      <section className="rounded-2xl border-[1.5px] border-primary bg-card p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </span>
          <p className="text-lg font-bold">{headline}</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          {status === 'applied'
            ? `선발 결과는 ${ev.announce_at ? formatWhen(ev.announce_at, false) + '에 ' : ''}${formatPhone(app.phone)}(으)로 문자로 알려 드려요.`
            : status === 'selected'
              ? `행사 전날 ${formatPhone(app.phone)}(으)로 안내 문자를 보내 드려요. 못 오시게 되면 꼭 신청을 취소해 주세요. 대기자에게 자리가 넘어가요.`
              : status === 'waitlist'
                ? '자리가 나면 문자로 바로 알려 드려요.'
                : '신청해 주셔서 고마워요. 다음 행사 소식을 알려 드릴게요.'}
        </p>
        <dl className="mt-3 grid grid-cols-[72px_1fr] gap-y-1 text-sm">
          <dt className="text-muted-foreground">상태</dt>
          <dd className="font-semibold">{PILOT_STATUS_LABELS[status]}</dd>
          <dt className="text-muted-foreground">이름</dt>
          <dd>{app.name}</dd>
          <dt className="text-muted-foreground">{app.is_student ? '학교' : '구분'}</dt>
          <dd>{app.is_student ? [app.school, app.major, app.grade].filter(Boolean).join(' · ') : '일반 시민'}</dd>
        </dl>
        <div className="mt-4 flex gap-2">
          {!closed && (
            <button type="button" onClick={onEdit} className="h-10 flex-1 rounded-xl border border-border bg-background text-sm font-semibold">
              정보 고치기
            </button>
          )}
          {new Date(ev.event_at).getTime() > Date.now() && (
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() => {
                if (!window.confirm('신청을 취소할까요? 마감 전이면 다시 신청할 수 있어요.')) return;
                cancel.mutate(undefined, {
                  onSuccess: () => toast.success('신청을 취소했어요'),
                  onError: () => toast.error('잠시 후 다시 시도해 주세요'),
                });
              }}
              className="h-10 flex-1 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary"
            >
              신청 취소
            </button>
          )}
        </div>
      </section>

      {agenda && agenda.status !== 'draft' && (
        <section className="space-y-2">
          <div className="px-1">
            <p className="text-sm font-bold">행사 의제에 지금 생각을 남겨 주세요 (1분)</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              행사 날 마지막 생각과 비교해 &lsquo;생각이 바뀐 비율&rsquo;을 봐요. 맞고 틀린 답은 없어요.
            </p>
          </div>
          <QuickParticipate
            agendaId={agenda.id}
            question={agenda.question?.trim() || agenda.title}
            onMore={() => navigate(`/gonglon/${agenda.id}`)}
          />
        </section>
      )}
    </>
  );
}

function ApplyForm({
  ev,
  initial,
  onDone,
  onCancelEdit,
}: {
  ev: PilotEvent;
  initial: MyPilotApplication | null;
  onDone: () => void;
  onCancelEdit?: () => void;
}) {
  const { user } = useAuthContext();
  const apply = useApplyPilot(ev.slug);
  const { requireLogin, loginModal } = useLoginPrompt();
  const [v, setV] = useState<PilotApplyInput>(EMPTY);
  const [schoolPick, setSchoolPick] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [touched, setTouched] = useState(false);

  // 고치기: 낸 신청서 내용으로 채운다
  useEffect(() => {
    if (!initial) return;
    setV({
      name: initial.name,
      phone: formatPhone(initial.phone),
      isStudent: initial.is_student,
      school: initial.school,
      major: initial.major,
      grade: initial.grade,
      heardFrom: initial.heard_from,
      consentPrivacy: true, // 이미 동의하고 낸 신청서 (체크를 풀면 저장되지 않음)
      consentPhoto: initial.consent_photo,
    });
    setSchoolPick(initial.school && !ev.schools.includes(initial.school) ? OTHER_SCHOOL : initial.school);
  }, [initial, ev.schools]);

  const set = <K extends keyof PilotApplyInput>(k: K, val: PilotApplyInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const problems = useMemo(() => {
    const p: Partial<Record<'name' | 'phone' | 'school' | 'consent', string>> = {};
    if (v.name.trim().length < 2) p.name = '이름을 적어 주세요';
    if (!isValidPhone(v.phone)) p.phone = '휴대전화 번호를 확인해 주세요 (010으로 시작)';
    if (v.isStudent && v.school.trim().length < 2) p.school = '학교를 골라 주세요';
    if (!v.consentPrivacy) p.consent = '필수 동의가 필요해요';
    return p;
  }, [v]);
  const ok = Object.keys(problems).length === 0;

  const submit = () => {
    setTouched(true);
    if (!ok) return;
    requireLogin('apply', () =>
      apply.mutate(v, {
        onSuccess: (r) => {
          toast.success(r.updated ? '신청 내용을 고쳤어요' : '신청했어요');
          onDone();
        },
        onError: (e) => toast.error(e instanceof PilotError ? PILOT_ERROR_TEXT[e.message] ?? '잠시 후 다시 시도해 주세요' : '잠시 후 다시 시도해 주세요'),
      }),
    );
  };

  const err = (k: keyof typeof problems) =>
    touched && problems[k] ? <p className="mt-1 text-xs font-medium text-destructive">{problems[k]}</p> : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-bold">{initial && initial.status !== 'cancelled' ? '신청 내용 고치기' : '신청서'}</h3>
      {!user && <p className="mt-1 text-xs text-muted-foreground">다 적고 &lsquo;신청하기&rsquo;를 누르면 로그인 화면이 나와요. 적은 내용은 그대로 남아요.</p>}

      <div className="mt-4 space-y-4">
        <Field label="이름" required>
          <input
            value={v.name}
            onChange={(e) => set('name', e.target.value.slice(0, 30))}
            autoComplete="name"
            placeholder="홍길동"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px]"
          />
          {err('name')}
        </Field>

        <Field label="휴대전화" required hint="선발 결과와 행사 안내 문자를 보내요">
          <input
            value={v.phone}
            onChange={(e) => set('phone', formatPhone(e.target.value))}
            inputMode="numeric"
            autoComplete="tel"
            placeholder="010-1234-5678"
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px]"
          />
          {err('phone')}
        </Field>

        {ev.allow_public && (
          <Field label="구분" required>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: true, label: '대학(원)생' },
                { val: false, label: '일반 시민' },
              ].map((o) => (
                <button
                  key={String(o.val)}
                  type="button"
                  onClick={() => set('isStudent', o.val)}
                  className={cn(
                    'h-11 rounded-xl border text-sm font-semibold',
                    v.isStudent === o.val ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        {v.isStudent && (
          <>
            <Field label="학교" required>
              <select
                value={schoolPick}
                onChange={(e) => {
                  setSchoolPick(e.target.value);
                  set('school', e.target.value === OTHER_SCHOOL ? '' : e.target.value);
                }}
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px]"
              >
                <option value="">학교를 골라 주세요</option>
                {ev.schools.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value={OTHER_SCHOOL}>그 밖의 학교 (직접 적기)</option>
              </select>
              {schoolPick === OTHER_SCHOOL && (
                <input
                  value={v.school}
                  onChange={(e) => set('school', e.target.value.slice(0, 40))}
                  placeholder="학교 이름"
                  className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px]"
                />
              )}
              {err('school')}
            </Field>

            <Field label="학과">
              <input
                value={v.major}
                onChange={(e) => set('major', e.target.value.slice(0, 40))}
                placeholder="예: 행정학과"
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-[15px]"
              />
            </Field>

            <Field label="학년">
              <Chips options={GRADE_OPTIONS} value={v.grade} onChange={(g) => set('grade', g)} />
            </Field>
          </>
        )}

        <Field label="어디서 알게 됐나요?">
          <Chips options={HEARD_FROM_OPTIONS} value={v.heardFrom} onChange={(h) => set('heardFrom', h)} />
        </Field>

        <div className="space-y-3 rounded-xl bg-secondary p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={v.consentPrivacy}
              onChange={(e) => set('consentPrivacy', e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span className="text-sm leading-relaxed">
              <b>[필수]</b> 행사 참가 신청을 위한 개인정보 수집·이용에 동의해요
            </span>
          </label>
          <button
            type="button"
            onClick={() => setShowDetail((s) => !s)}
            className="flex items-center gap-1 pl-8 text-xs font-semibold text-muted-foreground"
          >
            자세히 보기 <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showDetail && 'rotate-180')} />
          </button>
          {showDetail && <ConsentDetail />}
          {err('consent')}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={v.consentPhoto}
              onChange={(e) => set('consentPhoto', e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
            />
            <span className="text-sm leading-relaxed">
              <b>[선택]</b> 행사 사진·영상에 내 모습이 담겨 민심잇다 소식과 후원 기관 보도자료에 쓰이는 데 동의해요. 동의하지 않아도 참가할 수 있고, 당일 명찰에 표시해 촬영에서 빼 드려요.
            </span>
          </label>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        {onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="h-12 rounded-xl px-4 text-sm font-semibold text-muted-foreground">
            그만두기
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={apply.isPending}
          className="h-12 flex-1 rounded-xl bg-primary text-[15px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {apply.isPending ? '보내는 중…' : initial && initial.status !== 'cancelled' ? '고친 내용 저장' : '신청하기'}
        </button>
      </div>
      {loginModal}
    </section>
  );
}

function ConsentDetail() {
  return (
    <div className="ml-8 space-y-2 rounded-lg bg-background p-3 text-xs leading-relaxed text-foreground/80">
      <p>
        <b>모으는 정보</b>: 이름, 휴대전화 번호, 학생 여부, 학교·학과·학년, 알게 된 경로, 사진 촬영 동의 여부
      </p>
      <p>
        <b>쓰는 곳</b>: 참가자 선발(학교별 인원 맞추기), 선발 결과와 행사 안내 문자, 행사 당일 출석 확인
      </p>
      <p>
        <b>보관 기간</b>: 행사가 끝나고 3개월 안에 이름·연락처·학과·알게 된 경로를 지워요. 학교·학년은 개인을 알아볼 수 없는 통계로만 남겨요.
      </p>
      <p>
        <b>보는 사람</b>: 본인과 민심잇다 운영진만 봐요. 후원 기관에는 개인을 알아볼 수 없는 통계만 전해요.
      </p>
      <p>동의하지 않을 수 있지만, 그러면 신청할 수 없어요.</p>
      <Link to="/privacy" className="inline-block font-semibold text-primary">
        개인정보처리방침 전체 보기
      </Link>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-muted-foreground">{hint}</span>}
      </p>
      {children}
    </div>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? '' : o)}
          className={cn(
            'h-9 rounded-full border px-3 text-sm',
            value === o ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-input bg-background',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
