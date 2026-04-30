DO $$
DECLARE
  stale_count int;
BEGIN
  SELECT COUNT(*) INTO stale_count
  FROM earned_rewards er
  WHERE er.source_reward_id IN (SELECT id FROM task_custom_rewards WHERE is_token = true);

  IF stale_count > 0 THEN
    DELETE FROM earned_rewards
    WHERE source_reward_id IN (SELECT id FROM task_custom_rewards WHERE is_token = true);

    INSERT INTO tokens_balance (owner, balance, last_weekly_grant, last_monthly_grant)
    VALUES ('Barča', LEAST(20, stale_count), NULL, NULL)
    ON CONFLICT (owner) DO UPDATE
      SET balance = LEAST(20, tokens_balance.balance + stale_count);

    INSERT INTO token_transactions (owner, amount, reason, note)
    VALUES ('Barča', stale_count, 'task_reward', 'migration: stale token vouchers');
  END IF;
END $$;