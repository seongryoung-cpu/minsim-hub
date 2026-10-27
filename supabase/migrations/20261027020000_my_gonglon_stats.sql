-- 마이 페이지 '나의 공론' 숫자: 참여한 의제, 생각이 바뀐 의제, 남긴 의견, 마지막 생각을 안 남긴 열린 의제
CREATE OR REPLACE FUNCTION public.get_my_gonglon_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH v AS (
    SELECT agenda_id,
           max(choice) FILTER (WHERE stage = 'first') AS f,
           max(choice) FILTER (WHERE stage = 'final') AS l
    FROM agenda_votes
    WHERE user_id = auth.uid()
    GROUP BY agenda_id
  ), pending AS (
    SELECT v.agenda_id, a.closes_at
    FROM v JOIN agendas a ON a.id = v.agenda_id
    WHERE v.f IS NOT NULL AND v.l IS NULL
      AND public.agenda_effective_status(a.status, a.closes_at) = 'open'
  )
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'agendas', (SELECT count(*) FROM v),
    'changed', (SELECT count(*) FROM v WHERE f IS NOT NULL AND l IS NOT NULL AND f <> l),
    'statements', (SELECT count(*) FROM agenda_statements WHERE user_id = auth.uid() AND NOT is_hidden),
    'needs_final', (SELECT count(*) FROM pending),
    'needs_final_agenda_id', (SELECT agenda_id FROM pending ORDER BY closes_at NULLS LAST LIMIT 1)
  ) END
$$;

REVOKE ALL ON FUNCTION public.get_my_gonglon_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_gonglon_stats() TO authenticated;
