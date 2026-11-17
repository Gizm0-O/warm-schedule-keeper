REVOKE EXECUTE ON FUNCTION public.get_email_by_username(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.email_has_account(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.email_has_account(text) TO authenticated, service_role;