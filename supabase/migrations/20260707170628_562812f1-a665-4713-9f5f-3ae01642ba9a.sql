
-- Helper: resolve admin & Barča user_ids dynamically via person_key / role
CREATE OR REPLACE FUNCTION public.get_admin_uid() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT ur.user_id FROM public.user_roles ur WHERE ur.role='admin' LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_barca_uid() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT user_id FROM public.profiles WHERE person_key='Barca' LIMIT 1
$$;

-- Generic notifier for gifts / ideas / changelog
CREATE OR REPLACE FUNCTION public.notify_new_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_admin uuid := public.get_admin_uid();
  v_barca uuid := public.get_barca_uid();
  v_actor uuid := auth.uid();
  v_title text;
  v_body  text;
  v_link  text;
BEGIN
  IF TG_TABLE_NAME = 'gift_wishes' THEN
    v_title := 'Nové přání: ' || COALESCE(NEW.name,'');
    v_body  := 'Přidáno do „' || COALESCE(NEW.owner,'') || ' si přeje…"';
    v_link  := '/gifts';
  ELSIF TG_TABLE_NAME = 'gift_ideas' THEN
    v_title := 'Nový nápad na dárek: ' || COALESCE(NEW.name,'');
    v_body  := 'Pro: ' || COALESCE(NEW.recipient,'');
    v_link  := '/gifts';
  ELSIF TG_TABLE_NAME = 'ideas' THEN
    v_title := 'Nový nápad: ' || COALESCE(NEW.name,'');
    v_body  := NEW.description;
    v_link  := '/ideas';
  ELSIF TG_TABLE_NAME = 'changelog_entries' THEN
    v_title := 'Nová změna: ' || COALESCE(NEW.title,'');
    v_body  := NEW.description;
    v_link  := '/changelog';
  END IF;

  -- Admin gets notified when someone else (not admin) adds
  IF v_admin IS NOT NULL AND v_actor IS DISTINCT FROM v_admin THEN
    INSERT INTO public.notifications(user_id,title,body,type,link,created_by)
    VALUES (v_admin, v_title, v_body, 'item_added', v_link, v_actor);
  END IF;

  -- Barča gets notified when admin adds gifts / ideas (not changelog)
  IF TG_TABLE_NAME IN ('gift_wishes','gift_ideas','ideas')
     AND v_barca IS NOT NULL AND v_actor = v_admin AND v_barca <> v_admin THEN
    INSERT INTO public.notifications(user_id,title,body,type,link,created_by)
    VALUES (v_barca, v_title, v_body, 'item_added', v_link, v_actor);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_gift_wishes ON public.gift_wishes;
CREATE TRIGGER trg_notify_gift_wishes AFTER INSERT ON public.gift_wishes
FOR EACH ROW EXECUTE FUNCTION public.notify_new_item();

DROP TRIGGER IF EXISTS trg_notify_gift_ideas ON public.gift_ideas;
CREATE TRIGGER trg_notify_gift_ideas AFTER INSERT ON public.gift_ideas
FOR EACH ROW EXECUTE FUNCTION public.notify_new_item();

DROP TRIGGER IF EXISTS trg_notify_ideas ON public.ideas;
CREATE TRIGGER trg_notify_ideas AFTER INSERT ON public.ideas
FOR EACH ROW EXECUTE FUNCTION public.notify_new_item();

DROP TRIGGER IF EXISTS trg_notify_changelog ON public.changelog_entries;
CREATE TRIGGER trg_notify_changelog AFTER INSERT ON public.changelog_entries
FOR EACH ROW EXECUTE FUNCTION public.notify_new_item();

-- Todos: assignment notifies the assignee (existing function), but skip if actor = assignee
CREATE OR REPLACE FUNCTION public.notify_todo_assigned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid;
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.person IS NOT DISTINCT FROM OLD.person THEN
    RETURN NEW;
  END IF;
  IF NEW.recurrence IS NOT NULL AND NEW.recurrence <> 'none' THEN
    RETURN NEW;
  END IF;
  v_uid := public.person_to_user_id(NEW.person);
  IF v_uid IS NULL OR v_uid = v_actor THEN RETURN NEW; END IF;
  INSERT INTO public.notifications (user_id, title, body, type, todo_id, link, created_by)
  VALUES (v_uid, 'Nový úkol', NEW.text, 'task_assigned', NEW.id, '/todo', v_actor);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_todo_assigned ON public.todos;
CREATE TRIGGER trg_notify_todo_assigned AFTER INSERT OR UPDATE OF person ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.notify_todo_assigned();

-- Earned rewards: notify Barča when she receives a task-derived voucher;
-- notify admin when Barča activates one
CREATE OR REPLACE FUNCTION public.notify_earned_reward()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_admin uuid := public.get_admin_uid();
  v_barca uuid := public.get_barca_uid();
  v_actor uuid := auth.uid();
  v_person text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.todo_id IS NOT NULL THEN
      BEGIN
        SELECT person INTO v_person FROM public.todos WHERE id::text = NEW.todo_id LIMIT 1;
      EXCEPTION WHEN OTHERS THEN v_person := NULL; END;
      IF v_person = 'Barča' AND v_barca IS NOT NULL AND v_actor IS DISTINCT FROM v_barca THEN
        INSERT INTO public.notifications(user_id,title,body,type,link,created_by)
        VALUES (v_barca, 'Získala jsi poukázku 🎁', NEW.label, 'reward_earned', '/', v_actor);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active' THEN
    IF v_admin IS NOT NULL AND v_actor IS DISTINCT FROM v_admin THEN
      INSERT INTO public.notifications(user_id,title,body,type,link,created_by)
      VALUES (v_admin, 'Barča aktivovala poukázku 🎟️', NEW.label, 'reward_activated', '/', v_actor);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_earned_reward_ins ON public.earned_rewards;
CREATE TRIGGER trg_notify_earned_reward_ins AFTER INSERT ON public.earned_rewards
FOR EACH ROW EXECUTE FUNCTION public.notify_earned_reward();

DROP TRIGGER IF EXISTS trg_notify_earned_reward_upd ON public.earned_rewards;
CREATE TRIGGER trg_notify_earned_reward_upd AFTER UPDATE OF status ON public.earned_rewards
FOR EACH ROW EXECUTE FUNCTION public.notify_earned_reward();
