-- ============================================================================
-- DE-BLOSSOM: Promote a Member to Cooperative Administrator
-- Run this in your Supabase SQL Editor to grant admin privileges to a user.
-- ============================================================================

-- Replace with the member's registered email address
DO $$
DECLARE
  target_email TEXT := 'admin@deblossom.coop'; -- << CHANGE THIS TO YOUR EMAIL
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = target_email;

  IF FOUND THEN
    RAISE NOTICE 'User % has been successfully promoted to admin!', target_email;
  ELSE
    RAISE NOTICE 'No profile found with email: %. Make sure the user has registered first.', target_email;
  END IF;
END $$;
