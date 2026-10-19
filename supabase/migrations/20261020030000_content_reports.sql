-- 공론 글 신고: 주장(agenda_claims)·한 줄 의견(agenda_statements)
-- - 시민은 글마다 한 번 신고할 수 있다 (사유 고르기 + 짧은 설명)
-- - 신고만으로 글을 자동으로 숨기지 않는다 (반대 진영의 몰아 신고 악용 방지). 운영진이 확인해 숨김/유지를 정한다
-- - 숨김은 되돌릴 수 있다. 법적 분쟁 대비로 신고 기록과 원문은 지우지 않는다

CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_kind text NOT NULL CHECK (target_kind IN ('claim', 'statement')),
  target_id uuid NOT NULL,
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('abuse', 'defamation', 'privacy', 'spam', 'other')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 200),
  resolution text CHECK (resolution IN ('hidden', 'kept')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_kind, target_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS content_reports_open_idx ON public.content_reports (target_kind, target_id) WHERE resolved_at IS NULL;

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read content reports" ON public.content_reports;
CREATE POLICY "Admins read content reports" ON public.content_reports FOR SELECT USING (public.is_admin(auth.uid()));
-- 쓰기는 아래 함수로만

-- 신고하기
CREATE OR REPLACE FUNCTION public.report_content(p_kind text, p_id uuid, p_reason text, p_note text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_agenda uuid;
  v_author uuid;
  v_note text := btrim(coalesce(p_note, ''));
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  IF p_kind NOT IN ('claim', 'statement') OR p_reason NOT IN ('abuse', 'defamation', 'privacy', 'spam', 'other')
     OR char_length(v_note) > 200 THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;

  IF p_kind = 'claim' THEN
    SELECT agenda_id, user_id INTO v_agenda, v_author FROM agenda_claims WHERE id = p_id AND status <> 'hidden';
  ELSE
    SELECT agenda_id, user_id INTO v_agenda, v_author FROM agenda_statements WHERE id = p_id AND NOT is_hidden;
  END IF;
  IF v_agenda IS NULL THEN RETURN jsonb_build_object('error', 'not_found'); END IF;
  IF v_author = v_user THEN RETURN jsonb_build_object('error', 'own_content'); END IF;

  -- 한 사람이 하루에 너무 많이 신고하지 못하게 (몰아 신고 방지)
  IF (SELECT count(*) FROM content_reports WHERE reporter_id = v_user AND created_at > now() - interval '1 day') >= 20 THEN
    RETURN jsonb_build_object('error', 'report_limit');
  END IF;

  INSERT INTO content_reports (target_kind, target_id, agenda_id, reporter_id, reason, note)
  VALUES (p_kind, p_id, v_agenda, v_user, p_reason, v_note)
  ON CONFLICT (target_kind, target_id, reporter_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'already', NOT FOUND);
END $$;
REVOKE ALL ON FUNCTION public.report_content(text, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_content(text, uuid, text, text) TO authenticated;

-- 관리자 신고 목록: 글 하나에 한 줄 (처리 안 된 신고 많은 순 → 최근 순)
CREATE OR REPLACE FUNCTION public.admin_report_queue(p_include_resolved boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN coalesce((
    WITH g AS (
      SELECT target_kind, target_id, agenda_id,
             count(*) FILTER (WHERE resolved_at IS NULL)::int AS open_count,
             count(*)::int AS total_count,
             max(created_at) AS last_at,
             (array_agg(resolution ORDER BY resolved_at DESC NULLS LAST))[1] AS last_resolution
      FROM content_reports
      GROUP BY target_kind, target_id, agenda_id
      HAVING p_include_resolved OR count(*) FILTER (WHERE resolved_at IS NULL) > 0
    )
    SELECT jsonb_agg(jsonb_build_object(
      'target_kind', g.target_kind, 'target_id', g.target_id, 'agenda_id', g.agenda_id, 'agenda_title', a.title,
      'body', coalesce(c.body, s.body),
      'is_hidden', CASE g.target_kind WHEN 'claim' THEN c.status = 'hidden' ELSE coalesce(s.is_hidden, false) END,
      'author', CASE WHEN g.target_kind = 'claim' AND c.user_id IS NULL THEN '운영진'
                     ELSE coalesce(nullif(btrim(pr.nickname), ''), '시민') END,
      'open_count', g.open_count, 'total_count', g.total_count, 'last_at', g.last_at, 'last_resolution', g.last_resolution,
      'reasons', (SELECT jsonb_object_agg(x.reason, x.n) FROM (
                    SELECT r.reason, count(*)::int AS n FROM content_reports r
                    WHERE r.target_kind = g.target_kind AND r.target_id = g.target_id GROUP BY r.reason) x),
      'notes', (SELECT coalesce(jsonb_agg(n.note ORDER BY n.created_at DESC), '[]'::jsonb) FROM (
                  SELECT r.note, r.created_at FROM content_reports r
                  WHERE r.target_kind = g.target_kind AND r.target_id = g.target_id AND r.note <> ''
                  ORDER BY r.created_at DESC LIMIT 5) n)
    ) ORDER BY g.open_count DESC, g.last_at DESC)
    FROM g
    JOIN agendas a ON a.id = g.agenda_id
    LEFT JOIN agenda_claims c ON g.target_kind = 'claim' AND c.id = g.target_id
    LEFT JOIN agenda_statements s ON g.target_kind = 'statement' AND s.id = g.target_id
    LEFT JOIN profiles pr ON pr.user_id = coalesce(c.user_id, s.user_id)
  ), '[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.admin_report_queue(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_report_queue(boolean) TO authenticated;

-- 관리자 처리: 숨기기(hide) 또는 유지(keep). 그 글의 처리 안 된 신고를 모두 닫는다
CREATE OR REPLACE FUNCTION public.admin_resolve_report(p_kind text, p_id uuid, p_action text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid := auth.uid(); v_n int;
BEGIN
  IF NOT public.is_admin(v_admin) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_kind NOT IN ('claim', 'statement') OR p_action NOT IN ('hide', 'keep') THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;
  IF p_action = 'hide' THEN
    IF p_kind = 'claim' THEN UPDATE agenda_claims SET status = 'hidden', updated_at = now() WHERE id = p_id;
    ELSE UPDATE agenda_statements SET is_hidden = true WHERE id = p_id; END IF;
  END IF;
  UPDATE content_reports SET resolution = CASE p_action WHEN 'hide' THEN 'hidden' ELSE 'kept' END,
         resolved_by = v_admin, resolved_at = now()
  WHERE target_kind = p_kind AND target_id = p_id AND resolved_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'resolved', v_n);
END $$;
REVOKE ALL ON FUNCTION public.admin_resolve_report(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_report(text, uuid, text) TO authenticated;

-- 관리자 화면 배지용: 처리 안 된 신고가 걸린 글 수
CREATE OR REPLACE FUNCTION public.admin_open_report_count()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.is_admin(auth.uid())
    THEN (SELECT count(DISTINCT (target_kind, target_id))::int FROM content_reports WHERE resolved_at IS NULL)
    ELSE 0 END $$;
REVOKE ALL ON FUNCTION public.admin_open_report_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_open_report_count() TO authenticated;
