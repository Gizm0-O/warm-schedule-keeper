-- Remove existing duplicates (keep earliest) for weekly/monthly grants
DELETE FROM public.token_transactions a
USING public.token_transactions b
WHERE a.ctid > b.ctid
  AND a.owner = b.owner
  AND a.reason = b.reason
  AND a.note IS NOT DISTINCT FROM b.note
  AND a.reason IN ('weekly','monthly');

-- Prevent future duplicates for weekly/monthly grants
CREATE UNIQUE INDEX IF NOT EXISTS token_transactions_unique_grant
  ON public.token_transactions (owner, reason, note)
  WHERE reason IN ('weekly','monthly');
