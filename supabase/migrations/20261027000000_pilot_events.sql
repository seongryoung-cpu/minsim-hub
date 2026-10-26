-- 오프라인 행사 참가 신청 (첫 행사: 2026-12-05 대학생 공론장)
-- - 행사(pilot_events)마다 참가 신청(pilot_applications)을 받는다. 로그인한 사람만, 행사마다 한 번
-- - 연락처 같은 개인정보는 이 표에만 둔다 (따로 시트로 옮기지 않는다). 본인과 운영진만 본다
-- - 선발은 운영진이 학교별 인원과 사전 의견(행사 의제의 첫 의견) 찬반을 보고 정한다
-- - 행사가 끝나면 운영진이 개인정보를 지운다 (admin_pilot_purge_personal). 통계용 학교·학년만 남긴다

CREATE TABLE IF NOT EXISTS public.pilot_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,40}$'),
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 80),
  summary text NOT NULL DEFAULT '' CHECK (char_length(summary) <= 600),
  event_at timestamptz NOT NULL,
  venue text NOT NULL DEFAULT '' CHECK (char_length(venue) <= 120),
  apply_closes_at timestamptz NOT NULL,
  announce_at timestamptz,                       -- 선발 결과 안내일
  capacity int NOT NULL DEFAULT 100 CHECK (capacity BETWEEN 1 AND 2000),
  agenda_id uuid REFERENCES public.agendas(id) ON DELETE SET NULL, -- 사전 의견을 받을 의제 (정해지면)
  schools text[] NOT NULL DEFAULT '{}',          -- 신청서 학교 선택지
  allow_public boolean NOT NULL DEFAULT true,    -- 학생이 아닌 일반 시민 신청 허용
  is_published boolean NOT NULL DEFAULT false,   -- 신청 화면 공개
  personal_purged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pilot_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.pilot_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  is_student boolean NOT NULL DEFAULT true,
  school text NOT NULL DEFAULT '',
  major text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT '',
  heard_from text NOT NULL DEFAULT '',
  consent_privacy_at timestamptz NOT NULL,
  consent_photo boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'selected', 'waitlist', 'declined', 'cancelled')),
  admin_note text NOT NULL DEFAULT '' CHECK (char_length(admin_note) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS pilot_applications_event_idx ON public.pilot_applications (event_id, status);

ALTER TABLE public.pilot_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilot_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read published pilot events" ON public.pilot_events;
CREATE POLICY "Read published pilot events" ON public.pilot_events FOR SELECT
  USING (is_published OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins manage pilot events" ON public.pilot_events;
CREATE POLICY "Admins manage pilot events" ON public.pilot_events FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 신청서는 본인 것만 읽는다 (운영진은 admin_pilot_applications 로). 쓰기는 아래 함수로만
DROP POLICY IF EXISTS "Own pilot application" ON public.pilot_applications;
CREATE POLICY "Own pilot application" ON public.pilot_applications FOR SELECT USING (auth.uid() = user_id);

-- 신청하기 / 고치기 (마감 전까지). 선발·대기 처리된 뒤에도 연락처는 고칠 수 있다
CREATE OR REPLACE FUNCTION public.apply_pilot(
  p_slug text, p_name text, p_phone text, p_is_student boolean, p_school text,
  p_major text, p_grade text, p_heard_from text, p_consent_privacy boolean, p_consent_photo boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ev pilot_events%ROWTYPE;
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_school text := btrim(coalesce(p_school, ''));
  v_existing pilot_applications%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  SELECT * INTO v_ev FROM pilot_events WHERE slug = p_slug AND is_published;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF now() > v_ev.apply_closes_at THEN RETURN jsonb_build_object('error', 'closed'); END IF;
  IF NOT coalesce(p_consent_privacy, false) THEN RETURN jsonb_build_object('error', 'consent_required'); END IF;
  IF char_length(v_name) NOT BETWEEN 2 AND 30
     OR v_phone !~ '^01[0-9]{8,9}$'
     OR (coalesce(p_is_student, true) AND char_length(v_school) NOT BETWEEN 2 AND 40)
     OR (NOT coalesce(p_is_student, true) AND NOT v_ev.allow_public)
     OR char_length(coalesce(p_major, '')) > 40 OR char_length(coalesce(p_grade, '')) > 20
     OR char_length(coalesce(p_heard_from, '')) > 40 THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;

  SELECT * INTO v_existing FROM pilot_applications WHERE event_id = v_ev.id AND user_id = v_user;
  IF FOUND THEN
    UPDATE pilot_applications SET
      name = v_name, phone = v_phone, is_student = coalesce(p_is_student, true),
      school = CASE WHEN coalesce(p_is_student, true) THEN v_school ELSE '' END,
      major = btrim(coalesce(p_major, '')), grade = btrim(coalesce(p_grade, '')),
      heard_from = btrim(coalesce(p_heard_from, '')),
      consent_photo = coalesce(p_consent_photo, false),
      status = CASE WHEN status = 'cancelled' THEN 'applied' ELSE status END,
      updated_at = now()
    WHERE id = v_existing.id;
    RETURN jsonb_build_object('ok', true, 'updated', true);
  END IF;

  INSERT INTO pilot_applications (event_id, user_id, name, phone, is_student, school, major, grade, heard_from,
                                  consent_privacy_at, consent_photo)
  VALUES (v_ev.id, v_user, v_name, v_phone, coalesce(p_is_student, true),
          CASE WHEN coalesce(p_is_student, true) THEN v_school ELSE '' END,
          btrim(coalesce(p_major, '')), btrim(coalesce(p_grade, '')), btrim(coalesce(p_heard_from, '')),
          now(), coalesce(p_consent_photo, false));
  RETURN jsonb_build_object('ok', true, 'updated', false);
END $$;
REVOKE ALL ON FUNCTION public.apply_pilot(text, text, text, boolean, text, text, text, text, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_pilot(text, text, text, boolean, text, text, text, text, boolean, boolean) TO authenticated;

-- 신청 취소 (행사 전까지). 기록은 남기고 상태만 바꾼다
CREATE OR REPLACE FUNCTION public.cancel_pilot_application(p_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  UPDATE pilot_applications a SET status = 'cancelled', updated_at = now()
  FROM pilot_events e
  WHERE a.event_id = e.id AND e.slug = p_slug AND a.user_id = auth.uid() AND now() < e.event_at;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN CASE WHEN v_n > 0 THEN jsonb_build_object('ok', true) ELSE jsonb_build_object('error', 'not_found') END;
END $$;
REVOKE ALL ON FUNCTION public.cancel_pilot_application(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_pilot_application(text) TO authenticated;

-- 공개 화면용 신청 인원 (개인정보 없이 숫자만)
CREATE OR REPLACE FUNCTION public.pilot_application_count(p_slug text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM pilot_applications a JOIN pilot_events e ON e.id = a.event_id
  WHERE e.slug = p_slug AND e.is_published AND a.status <> 'cancelled' $$;
GRANT EXECUTE ON FUNCTION public.pilot_application_count(text) TO anon, authenticated;

-- 운영진 신청자 목록: 신청 정보 + 행사 의제의 사전 의견(첫 의견)
CREATE OR REPLACE FUNCTION public.admin_pilot_applications(p_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_agenda uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT agenda_id INTO v_agenda FROM pilot_events WHERE id = p_event_id;
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id', a.id, 'user_id', a.user_id, 'name', a.name, 'phone', a.phone, 'is_student', a.is_student,
      'school', a.school, 'major', a.major, 'grade', a.grade, 'heard_from', a.heard_from,
      'consent_photo', a.consent_photo, 'status', a.status, 'admin_note', a.admin_note,
      'created_at', a.created_at,
      -- 처음 의견이 있으면 그것, 1분 참여로 바로 최종 의견을 남겼으면 그것 (행사 전에 남긴 것만)
      'pre_choice', (SELECT v.choice FROM agenda_votes v
                     WHERE v.agenda_id = v_agenda AND v.user_id = a.user_id
                       AND v.created_at < (SELECT event_at FROM pilot_events WHERE id = p_event_id)
                     ORDER BY (v.stage = 'first') DESC, v.created_at LIMIT 1)
    ) ORDER BY a.created_at)
    FROM pilot_applications a WHERE a.event_id = p_event_id
  ), '[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.admin_pilot_applications(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pilot_applications(uuid) TO authenticated;

-- 운영진 선발 처리 (여러 명 한 번에)
CREATE OR REPLACE FUNCTION public.admin_set_pilot_status(p_ids uuid[], p_status text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_status NOT IN ('applied', 'selected', 'waitlist', 'declined') THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;
  UPDATE pilot_applications SET status = p_status,
         admin_note = CASE WHEN p_note IS NULL THEN admin_note ELSE left(p_note, 200) END,
         updated_at = now()
  WHERE id = ANY (p_ids) AND status <> 'cancelled';
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'updated', v_n);
END $$;
REVOKE ALL ON FUNCTION public.admin_set_pilot_status(uuid[], text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_pilot_status(uuid[], text, text) TO authenticated;

-- 행사 후 개인정보 지우기: 이름·연락처·학과·알게 된 경로·메모를 비운다 (학교·학년·상태는 통계로 남김)
CREATE OR REPLACE FUNCTION public.admin_pilot_purge_personal(p_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF (SELECT event_at FROM pilot_events WHERE id = p_event_id) > now() THEN
    RETURN jsonb_build_object('error', 'event_not_finished');
  END IF;
  UPDATE pilot_applications SET name = '', phone = '', major = '', heard_from = '', admin_note = '', updated_at = now()
  WHERE event_id = p_event_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  UPDATE pilot_events SET personal_purged_at = now(), updated_at = now() WHERE id = p_event_id;
  RETURN jsonb_build_object('ok', true, 'purged', v_n);
END $$;
REVOKE ALL ON FUNCTION public.admin_pilot_purge_personal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pilot_purge_personal(uuid) TO authenticated;
