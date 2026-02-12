-- ============================================
-- FIX: Auto-create user profile on signup
-- ============================================
-- Problem: When "Confirm email" is enabled in Supabase Auth,
-- the signUp() call does NOT create a session, so the client-side
-- upsert to the 'users' table fails due to RLS (no authenticated session).
-- Solution: Use a database trigger to automatically create the user
-- profile in the 'users' table when a new user is created in auth.users.
-- ============================================

-- Create the function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, plan, status, is_admin, is_composer, is_blocked, email_verified, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'free',
    'active',
    false,
    false,
    false,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after INSERT on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Also create a trigger for email confirmation
-- This updates email_verified when the user confirms their email
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS trigger AS $$
BEGIN
  -- Only trigger when email_confirmed_at changes from NULL to a value
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET email_verified = true
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;

-- Create trigger that fires after UPDATE on auth.users
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();

-- ============================================
-- Backfill: Create profiles for any existing auth.users
-- that don't have a profile in the users table yet
-- ============================================

INSERT INTO public.users (id, email, name, plan, status, is_admin, is_composer, is_blocked, email_verified, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'free',
  'active',
  false,
  false,
  false,
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;
