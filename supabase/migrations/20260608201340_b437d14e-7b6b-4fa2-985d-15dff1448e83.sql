
-- IDEAS
CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  difficulty smallint NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  cost smallint NOT NULL DEFAULT 1 CHECK (cost BETWEEN 1 AND 3),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','planned','in_progress','done','rejected')),
  category text,
  image_url text,
  url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved read ideas" ON public.ideas FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "approved insert ideas" ON public.ideas FOR INSERT TO authenticated
  WITH CHECK (public.is_approved(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "author or admin update ideas" ON public.ideas FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "author or admin delete ideas" ON public.ideas FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER ideas_set_updated_at BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- VOTES
CREATE TABLE public.idea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.idea_votes TO authenticated;
GRANT ALL ON public.idea_votes TO service_role;
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved read votes" ON public.idea_votes FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "self insert vote" ON public.idea_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "self delete vote" ON public.idea_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- COMMENTS
CREATE TABLE public.idea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idea_comments TO authenticated;
GRANT ALL ON public.idea_comments TO service_role;
ALTER TABLE public.idea_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approved read comments" ON public.idea_comments FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "self insert comment" ON public.idea_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_approved(auth.uid()));
CREATE POLICY "self update comment" ON public.idea_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "self or admin delete comment" ON public.idea_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
