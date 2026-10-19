-- 공론 결과 카드: 마감된 의제의 쟁점 지도
--   ① 분포와 생각이 바뀐 비율  ② 양쪽 모두 동의한 문장(공통분모)  ③ 가장 크게 갈린 문장
-- 기준 (첫 데이터를 보고 조정. 화면 문구도 이 값을 받아 쓴다)
--   최소 참여: 최종 의견 30명 / 집단별 반응 5명 이상인 문장만 / 공통분모: 두 집단 모두 60% 이상 동의 / 갈림: 동의율 차이 30%p 이상
-- 집단 = 사람마다 최종 의견(없으면 처음 반응)이 '찬성'인 사람과 '반대'인 사람. '잘 모르겠다'는 집단 계산에서 뺀다.
-- 무작위 표본이 아니므로 화면에 항상 "참여자 N명의 의견"을 붙인다. 선거 조용 모드에서는 관리자 외에 내리지 않는다.

CREATE OR REPLACE FUNCTION public.get_agenda_outcome(p_agenda_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c_min_final constant int := 30;
  c_min_group constant int := 5;
  c_common constant numeric := 0.6;
  c_divide constant numeric := 0.3;
  v_admin boolean := coalesce(public.is_admin(auth.uid()), false);
  v_status text;
  v_final int;
  v_people int;
  v_both int;
  v_changed int;
  v_dist jsonb;
  v_common jsonb;
  v_divisive jsonb;
  v_rules jsonb := jsonb_build_object('min_final', c_min_final, 'min_group', c_min_group, 'common', c_common, 'divide', c_divide);
BEGIN
  SELECT public.agenda_effective_status(status, closes_at) INTO v_status FROM agendas WHERE id = p_agenda_id;
  IF v_status IS NULL OR NOT public.gonglon_visible() OR (v_status = 'draft' AND NOT v_admin) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'not_found');
  END IF;
  IF v_status <> 'closed' AND NOT v_admin THEN
    RETURN jsonb_build_object('available', false, 'reason', 'open', 'rules', v_rules);
  END IF;
  IF public.app_setting_on('election_quiet_mode') AND NOT v_admin THEN
    RETURN jsonb_build_object('available', false, 'reason', 'quiet', 'rules', v_rules);
  END IF;

  SELECT count(*) FILTER (WHERE stage = 'final'), count(DISTINCT user_id) INTO v_final, v_people
  FROM agenda_votes WHERE agenda_id = p_agenda_id;

  SELECT jsonb_build_object(
           'agree', count(*) FILTER (WHERE choice = 'agree'),
           'disagree', count(*) FILTER (WHERE choice = 'disagree'),
           'hold', count(*) FILTER (WHERE choice = 'hold'))
    INTO v_dist
  FROM agenda_votes WHERE agenda_id = p_agenda_id AND stage = 'final';

  IF v_final < c_min_final THEN
    RETURN jsonb_build_object('available', false, 'reason', 'few', 'status', v_status,
      'final_participants', v_final, 'participants', v_people, 'distribution', v_dist, 'rules', v_rules);
  END IF;

  -- 처음과 마지막을 모두 남긴 사람 중 생각이 바뀐 사람
  SELECT count(*), count(*) FILTER (WHERE f.choice <> l.choice) INTO v_both, v_changed
  FROM agenda_votes f JOIN agenda_votes l ON l.agenda_id = f.agenda_id AND l.user_id = f.user_id AND l.stage = 'final'
  WHERE f.agenda_id = p_agenda_id AND f.stage = 'first';

  WITH side AS (            -- 사람마다 찬성/반대 집단
    SELECT user_id, coalesce(max(choice) FILTER (WHERE stage = 'final'), max(choice) FILTER (WHERE stage = 'first')) AS side
    FROM agenda_votes WHERE agenda_id = p_agenda_id GROUP BY user_id
  ), r AS (                 -- 문장마다 집단별 반응
    SELECT st.id, st.body,
           count(*) FILTER (WHERE sd.side = 'agree') AS n_a,
           count(*) FILTER (WHERE sd.side = 'agree' AND rx.choice = 'agree') AS y_a,
           count(*) FILTER (WHERE sd.side = 'disagree') AS n_d,
           count(*) FILTER (WHERE sd.side = 'disagree' AND rx.choice = 'agree') AS y_d
    FROM agenda_statements st
    JOIN statement_reactions rx ON rx.statement_id = st.id
    JOIN side sd ON sd.user_id = rx.user_id AND sd.side IN ('agree', 'disagree')
    WHERE st.agenda_id = p_agenda_id AND NOT st.is_hidden
    GROUP BY st.id, st.body
  ), e AS (
    SELECT id, body, n_a, n_d, y_a::numeric / n_a AS rate_a, y_d::numeric / n_d AS rate_d
    FROM r WHERE n_a >= c_min_group AND n_d >= c_min_group
  )
  SELECT
    (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'body', body, 'agree_side', round(rate_a, 2), 'disagree_side', round(rate_d, 2),
                                                  'n_agree_side', n_a, 'n_disagree_side', n_d) ORDER BY least(rate_a, rate_d) DESC), '[]'::jsonb)
       FROM (SELECT * FROM e WHERE rate_a >= c_common AND rate_d >= c_common ORDER BY least(rate_a, rate_d) DESC LIMIT 3) x),
    (SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'body', body, 'agree_side', round(rate_a, 2), 'disagree_side', round(rate_d, 2),
                                                  'n_agree_side', n_a, 'n_disagree_side', n_d) ORDER BY abs(rate_a - rate_d) DESC), '[]'::jsonb)
       FROM (SELECT * FROM e WHERE abs(rate_a - rate_d) >= c_divide ORDER BY abs(rate_a - rate_d) DESC LIMIT 2) y)
  INTO v_common, v_divisive;

  RETURN jsonb_build_object(
    'available', true,
    'status', v_status,
    'participants', v_people,
    'final_participants', v_final,
    'distribution', v_dist,
    'changed', v_changed,
    'changed_base', v_both,
    'common', v_common,
    'divisive', v_divisive,
    'rules', v_rules
  );
END $$;
GRANT EXECUTE ON FUNCTION public.get_agenda_outcome(uuid) TO anon, authenticated;
