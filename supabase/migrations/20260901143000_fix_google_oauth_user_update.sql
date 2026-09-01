-- Prevent profile synchronization failures from aborting Supabase Auth updates.
-- The public.users security trigger correctly protects server-controlled fields,
-- but legacy auth.users triggers allowed that rejection to bubble into GoTrue as
-- "Error updating user", invalidating otherwise successful Google OAuth logins.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Profile enrichment must never make authentication fail.
  RAISE WARNING 'Unable to create public user profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    BEGIN
      UPDATE public.users
      SET email_verified = true
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      -- public.users may deliberately reject this protected field. Authentication
      -- is authoritative and must still complete even if this cache is stale.
      RAISE WARNING 'Unable to mirror email verification for %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_user_email_confirmed() FROM PUBLIC;

COMMIT;
