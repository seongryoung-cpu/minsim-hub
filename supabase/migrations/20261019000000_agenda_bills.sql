-- 공론 의제 안의 '관련 법안' (국회 열린국회정보 API)
--  - 법안은 의제에 연결된 것만 저장한다 (전체 수집 안 함)
--  - 국회 자료(assembly_*)는 Edge Function(assembly-bills, 서비스 키)만 쓴다. 누구나 읽을 수 있다(공개 자료).
--  - 시민의 말로 쓴 요약(무엇이 바뀌나·누가·언제부터)은 운영진이 승인한 것만 공개
--  - 출처 표시: 열린국회정보 (이용약관 제7조)

-- ─────────────────────────────────────────────────────────────
-- 국회 법안 (연결된 것만)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assembly_bills (
  bill_id text PRIMARY KEY,                -- 국회 의안 ID (PRC_...)
  bill_no text,
  bill_name text NOT NULL,
  age int,                                 -- 대수 (22)
  proposer text,                           -- "○○○의원 등 10인"
  rst_proposer text,                       -- 대표발의자 이름 (쉼표 구분 가능)
  rst_mona_cd text,                        -- 대표발의자 국회 코드
  publ_proposer text,                      -- 공동발의자 이름 (쉼표 구분)
  committee text,                          -- 소관 위원회
  committee_id text,
  propose_dt date,                         -- 발의(접수)
  committee_dt date,                       -- 위원회 회부
  cmt_proc_dt date,                        -- 위원회 처리
  cmt_proc_result text,
  law_proc_dt date,                        -- 법사위 체계자구 처리
  plenary_dt date,                         -- 본회의 의결
  proc_result text,                        -- 원안가결, 수정가결, 대안반영폐기, 폐기, 철회, 부결, 임기만료폐기 …
  gov_transfer_dt date,                    -- 정부 이송
  promulgation_dt date,                    -- 공포
  stage text NOT NULL DEFAULT 'proposed'
    CHECK (stage IN ('proposed', 'committee', 'committee_done', 'judiciary', 'plenary_passed', 'transferred',
                     'promulgated', 'merged', 'discarded', 'withdrawn', 'rejected', 'expired')),
  stage_changed_on date,
  detail_link text,
  vote_member_total int,
  vote_total int,
  vote_yes int,
  vote_no int,
  vote_blank int,
  vote_date date,
  synced_at timestamptz NOT NULL DEFAULT now()
);

-- 단계가 바뀐 날짜 (결말 알림의 근거)
CREATE TABLE IF NOT EXISTS public.assembly_bill_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bill_id text NOT NULL REFERENCES public.assembly_bills(bill_id) ON DELETE CASCADE,
  stage text NOT NULL,
  event_on date,
  detected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bill_id, stage)
);

-- 본회의 의원별 표결 (표결한 법안만)
CREATE TABLE IF NOT EXISTS public.assembly_bill_votes (
  bill_id text NOT NULL REFERENCES public.assembly_bills(bill_id) ON DELETE CASCADE,
  mona_cd text NOT NULL,
  member_name text NOT NULL,
  party text,
  district text,                           -- 선거구 (예: 경기 용인시정, 비례대표)
  vote text NOT NULL,                      -- 찬성 / 반대 / 기권 / 불참
  PRIMARY KEY (bill_id, mona_cd)
);
CREATE INDEX IF NOT EXISTS assembly_bill_votes_district_idx ON public.assembly_bill_votes (district);

-- 의제 ↔ 법안 + 시민의 말로 쓴 요약
CREATE TABLE IF NOT EXISTS public.agenda_bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  bill_id text NOT NULL REFERENCES public.assembly_bills(bill_id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  plain_what text CHECK (plain_what IS NULL OR char_length(plain_what) <= 200),   -- 무엇이 바뀌나
  plain_who text CHECK (plain_who IS NULL OR char_length(plain_who) <= 120),      -- 누가 영향을 받나
  plain_when text CHECK (plain_when IS NULL OR char_length(plain_when) <= 80),    -- 언제부터
  plain_approved_at timestamptz,                                                   -- 승인돼야 화면에 요약이 보임
  plain_draft jsonb,                                                               -- AI 초안
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agenda_id, bill_id)
);
CREATE INDEX IF NOT EXISTS agenda_bills_agenda_idx ON public.agenda_bills (agenda_id);

-- 결말 알림 신청 (발송은 웹푸시 작업 때 연결)
CREATE TABLE IF NOT EXISTS public.bill_alert_subscriptions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id text NOT NULL REFERENCES public.assembly_bills(bill_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, bill_id)
);

-- 수집 기록
CREATE TABLE IF NOT EXISTS public.assembly_sync_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL,                       -- sync / link / refresh
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok boolean,
  detail jsonb
);

-- ─────────────────────────────────────────────────────────────
-- 권한
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.assembly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_bill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_bill_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_sync_runs ENABLE ROW LEVEL SECURITY;

-- 국회 공개 자료: 누구나 읽기, 쓰기는 서비스 키(Edge Function)만
DROP POLICY IF EXISTS "Public assembly bills" ON public.assembly_bills;
CREATE POLICY "Public assembly bills" ON public.assembly_bills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public assembly bill events" ON public.assembly_bill_events;
CREATE POLICY "Public assembly bill events" ON public.assembly_bill_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public assembly bill votes" ON public.assembly_bill_votes;
CREATE POLICY "Public assembly bill votes" ON public.assembly_bill_votes FOR SELECT USING (true);

-- 의제 연결: 표 자체는 관리자만 (승인 전 요약·AI 초안이 있으므로).
-- 시민 화면은 get_agenda_bills()로만 읽고, 그 함수가 승인된 요약만 내려 준다.
DROP POLICY IF EXISTS "Admins manage agenda bills" ON public.agenda_bills;
CREATE POLICY "Admins manage agenda bills" ON public.agenda_bills
  FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 알림 신청: 본인 것만
DROP POLICY IF EXISTS "Own bill alerts" ON public.bill_alert_subscriptions;
CREATE POLICY "Own bill alerts" ON public.bill_alert_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 수집 기록: 관리자만
DROP POLICY IF EXISTS "Admins read sync runs" ON public.assembly_sync_runs;
CREATE POLICY "Admins read sync runs" ON public.assembly_sync_runs FOR SELECT USING (public.is_admin(auth.uid()));

REVOKE ALL ON public.assembly_bills, public.assembly_bill_events, public.assembly_bill_votes FROM anon, authenticated;
GRANT SELECT ON public.assembly_bills, public.assembly_bill_events, public.assembly_bill_votes TO anon, authenticated;
REVOKE ALL ON public.agenda_bills FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_bills TO authenticated;
REVOKE ALL ON public.bill_alert_subscriptions FROM anon;
GRANT SELECT, INSERT, DELETE ON public.bill_alert_subscriptions TO authenticated;
REVOKE ALL ON public.assembly_sync_runs FROM anon;
GRANT SELECT ON public.assembly_sync_runs TO authenticated;

CREATE OR REPLACE FUNCTION public.agenda_bills_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN NEW.created_by := coalesce(NEW.created_by, auth.uid()); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS agenda_bills_touch ON public.agenda_bills;
CREATE TRIGGER agenda_bills_touch BEFORE INSERT ON public.agenda_bills
  FOR EACH ROW EXECUTE FUNCTION public.agenda_bills_touch();

-- ─────────────────────────────────────────────────────────────
-- 화면용: 의제의 관련 법안 (승인 안 된 요약은 비워서 내려 준다)
-- p_district: 우리 지역 선거구 이름 목록 (예: {'경기 수원시갑','경기 수원시을'}) → 그 지역 의원 표결만 함께
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_agenda_bills(p_agenda_id uuid, p_districts text[] DEFAULT '{}')
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(row ORDER BY (row->>'sort_order')::int, row->>'propose_dt' DESC), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'bill_id', b.bill_id, 'bill_no', b.bill_no, 'bill_name', b.bill_name, 'proposer', b.proposer,
      'rst_proposer', b.rst_proposer, 'committee', b.committee, 'stage', b.stage,
      'stage_changed_on', b.stage_changed_on, 'propose_dt', b.propose_dt, 'committee_dt', b.committee_dt,
      'proc_result', b.proc_result, 'detail_link', b.detail_link, 'synced_at', b.synced_at,
      'vote', CASE WHEN b.vote_total IS NULL THEN NULL ELSE jsonb_build_object(
        'member_total', b.vote_member_total, 'total', b.vote_total, 'yes', b.vote_yes, 'no', b.vote_no,
        'blank', b.vote_blank, 'date', b.vote_date) END,
      'sort_order', ab.sort_order,
      'plain', CASE WHEN ab.plain_approved_at IS NULL THEN NULL ELSE jsonb_build_object(
        'what', ab.plain_what, 'who', ab.plain_who, 'when', ab.plain_when) END,
      'events', (SELECT coalesce(jsonb_agg(jsonb_build_object('stage', e.stage, 'on', e.event_on) ORDER BY e.event_on NULLS LAST, e.id), '[]'::jsonb)
                 FROM assembly_bill_events e WHERE e.bill_id = b.bill_id),
      'local_votes', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', v.member_name, 'party', v.party, 'district', v.district, 'vote', v.vote) ORDER BY v.district, v.member_name), '[]'::jsonb)
                      FROM assembly_bill_votes v WHERE v.bill_id = b.bill_id AND v.district = ANY (p_districts)),
      'my_alert', EXISTS (SELECT 1 FROM bill_alert_subscriptions s WHERE s.bill_id = b.bill_id AND s.user_id = auth.uid()),
      'alert_count', (SELECT count(*) FROM bill_alert_subscriptions s WHERE s.bill_id = b.bill_id)
    ) AS row
    FROM agenda_bills ab
    JOIN agendas a ON a.id = ab.agenda_id AND (a.status <> 'draft' OR public.is_admin(auth.uid()))
    JOIN assembly_bills b ON b.bill_id = ab.bill_id
    WHERE ab.agenda_id = p_agenda_id AND public.gonglon_visible()
  ) t;
$$;
REVOKE EXECUTE ON FUNCTION public.get_agenda_bills(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_agenda_bills(uuid, text[]) TO anon, authenticated, service_role;

-- 우리 지역 선거구 이름 찾기 (표결 기록에 있는 선거구 중 시·도 약칭으로 시작하고 시·군·구 이름이 들어간 것)
-- 예: ({'경기'}, '수원시') → {'경기 수원시갑','경기 수원시을',…}. 통합 지역명(예: 전남광주통합특별시)은 약칭 목록에 함께 넣는다.
CREATE OR REPLACE FUNCTION public.assembly_districts_for(p_prefixes text[], p_sigungu text)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(array_agg(DISTINCT v.district), '{}')
  FROM assembly_bill_votes v
  WHERE EXISTS (SELECT 1 FROM unnest(p_prefixes) p WHERE v.district LIKE p || ' %')
    AND (coalesce(p_sigungu, '') = '' OR v.district LIKE '%' || p_sigungu || '%');
$$;
REVOKE EXECUTE ON FUNCTION public.assembly_districts_for(text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assembly_districts_for(text[], text) TO anon, authenticated, service_role;

-- 알림 신청 토글
CREATE OR REPLACE FUNCTION public.toggle_bill_alert(p_bill_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'login_required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM agenda_bills WHERE bill_id = p_bill_id) THEN RAISE EXCEPTION 'not_found'; END IF;
  IF EXISTS (SELECT 1 FROM bill_alert_subscriptions WHERE user_id = v_user AND bill_id = p_bill_id) THEN
    DELETE FROM bill_alert_subscriptions WHERE user_id = v_user AND bill_id = p_bill_id;
    RETURN false;
  END IF;
  INSERT INTO bill_alert_subscriptions (user_id, bill_id) VALUES (v_user, p_bill_id);
  RETURN true;
END $$;
REVOKE EXECUTE ON FUNCTION public.toggle_bill_alert(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_bill_alert(text) TO authenticated, service_role;

-- 매일 확인 예약 (06:10 KST = 21:10 UTC). 함수는 20시간 안에 이미 돌았으면 건너뛴다.
-- pg_net으로 Edge Function을 부른다. 예약 등록(cron.schedule)은 프로젝트 URL·공개 키가 필요해서 별도로 실행했다.
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
