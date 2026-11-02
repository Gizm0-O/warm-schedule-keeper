-- Pozastavení (ne smazání) měsíčního generování příběhů. Obnova: active := true
SELECT cron.alter_job(jobid, active := false) FROM cron.job WHERE jobname = 'generate-stories-monthly';