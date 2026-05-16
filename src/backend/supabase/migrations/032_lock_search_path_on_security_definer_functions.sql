-- Migration 032: Lock search_path on SECURITY DEFINER functions
--
-- A SECURITY DEFINER function runs with the *owner's* privileges. If its
-- search_path is unset, a user who can write to any schema on the resolution
-- path (notably `public` itself, where migration 002's broad grants live)
-- could shadow built-ins or reference tables and hijack the function. Pinning
-- search_path closes that hole.
--
-- Migrations 017, 026, and 029 already lock their own functions; this fixes
-- the older ones that predate the practice.

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, extensions;

ALTER FUNCTION public.is_admin()
  SET search_path = public, extensions;

ALTER FUNCTION public.current_user_is_active_seller()
  SET search_path = public, extensions;

ALTER FUNCTION public.cancel_overdue_pending_hanger_rentals()
  SET search_path = public, extensions;
