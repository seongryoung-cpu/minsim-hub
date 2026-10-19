-- 조건 질문: "어떤 조건이면 받아들일 수 있나요?" (여러 개 선택)
-- 운영진이 의제마다 3~5개를 적는다. '어떤 조건이어도 어렵다' 같은 선택지는 is_exclusive(다른 것과 함께 고를 수 없음)
-- 결과 카드 ④에 조건별 선택 비율로 나온다 (답한 사람 10명 이상일 때)

CREATE TABLE IF NOT EXISTS public.agenda_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 3 AND 60),
  is_exclusive boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agenda_conditions_agenda_idx ON public.agenda_conditions (agenda_id, sort_order);

CREATE TABLE IF NOT EXISTS public.condition_picks (
  condition_id uuid NOT NULL REFERENCES public.agenda_conditions(id) ON DELETE CASCADE,
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, condition_id)
);
CREATE INDEX IF NOT EXISTS condition_picks_agenda_idx ON public.condition_picks (agenda_id);

ALTER TABLE public.agenda_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condition_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read conditions of visible agendas" ON public.agenda_conditions;
CREATE POLICY "Read conditions of visible agendas" ON public.agenda_conditions FOR SELECT USING (
  public.is_admin(auth.uid())
  OR EXISTS (SELECT 1 FROM agendas a WHERE a.id = agenda_id AND a.status <> 'draft' AND public.gonglon_visible())
);
DROP POLICY IF EXISTS "Admins manage conditions" ON public.agenda_conditions;
CREATE POLICY "Admins manage conditions" ON public.agenda_conditions FOR ALL
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Own condition picks" ON public.condition_picks;
CREATE POLICY "Own condition picks" ON public.condition_picks FOR SELECT USING (auth.uid() = user_id);
-- 쓰기는 set_condition_picks 로만 (개별 선택은 공개하지 않고 결과 카드에서 비율로만)

-- 내 조건 선택 저장 (통째로 바꿈). 빈 배열 = 답 지우기
CREATE OR REPLACE FUNCTION public.set_condition_picks(p_agenda_id uuid, p_condition_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ids uuid[] := coalesce(p_condition_ids, '{}');
  v_valid int;
  v_excl int;
BEGIN
  IF v_user IS NULL THEN RETURN jsonb_build_object('error', 'login_required'); END IF;
  IF NOT public.agenda_is_open(p_agenda_id) THEN RETURN jsonb_build_object('error', 'agenda_not_open'); END IF;
  SELECT count(*), count(*) FILTER (WHERE is_exclusive) INTO v_valid, v_excl
  FROM agenda_conditions WHERE agenda_id = p_agenda_id AND id = ANY (v_ids);
  IF v_valid <> cardinality(v_ids) OR (v_excl > 0 AND cardinality(v_ids) > 1) THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;
  DELETE FROM condition_picks WHERE agenda_id = p_agenda_id AND user_id = v_user;
  INSERT INTO condition_picks (condition_id, agenda_id, user_id)
  SELECT unnest(v_ids), p_agenda_id, v_user;
  RETURN jsonb_build_object('ok', true, 'count', cardinality(v_ids));
END $$;
REVOKE ALL ON FUNCTION public.set_condition_picks(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_condition_picks(uuid, uuid[]) TO authenticated;
