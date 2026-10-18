-- 매일 국회 자료 확인 시각을 09:01 KST(= 00:01 UTC)로 바꾼다 (이전: 06:10 KST)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'assembly-bills-daily') THEN
    PERFORM cron.alter_job(job_id := (SELECT jobid FROM cron.job WHERE jobname = 'assembly-bills-daily'), schedule := '1 0 * * *');
  END IF;
END $$;
