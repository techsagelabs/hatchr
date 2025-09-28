-- ===================================================================
-- 🧪 CREATE: Auth Test Function for Production Debugging
-- This creates a function to test if auth.uid() is working properly
-- ===================================================================

-- Create function to test auth context
CREATE OR REPLACE FUNCTION auth_uid_test()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'auth_uid', auth.uid(),
    'auth_uid_text', auth.uid()::text,
    'auth_role', auth.role(),
    'jwt_claims', current_setting('request.jwt.claims', true)::json,
    'has_auth_uid', (auth.uid() IS NOT NULL),
    'timestamp', now()
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auth_uid_test() TO authenticated;
GRANT EXECUTE ON FUNCTION auth_uid_test() TO anon;

SELECT '✅ Auth test function created successfully' as result;
