-- ===================================================================
-- 🧪 TEST: Authentication Flow in Production
-- This tests if JWT tokens are being properly passed to the database
-- ===================================================================

-- 1. Test if we can see JWT headers
SELECT 
    '🔍 JWT Token Check:' as test_type,
    current_setting('request.jwt.claims', true) as raw_jwt_claims,
    current_setting('request.jwt.claim.sub', true) as jwt_user_id,
    current_setting('request.headers', true) as request_headers;

-- 2. Test if we can get session info
SELECT 
    '👤 Session Check:' as test_type,
    auth.uid() as auth_uid,
    auth.role() as auth_role,
    auth.jwt() as auth_jwt;

-- 3. Check if service vs anon key is being used
SELECT 
    '🔑 Key Type Check:' as test_type,
    current_setting('request.jwt.claim.role', true) as current_role,
    CASE 
        WHEN current_setting('request.jwt.claim.role', true) = 'service_role' THEN '🔧 SERVICE KEY (bypasses RLS)'
        WHEN current_setting('request.jwt.claim.role', true) = 'authenticated' THEN '✅ AUTHENTICATED USER'
        WHEN current_setting('request.jwt.claim.role', true) = 'anon' THEN '👤 ANONYMOUS USER'
        ELSE '❓ UNKNOWN ROLE'
    END as key_interpretation;

SELECT '🧪 Auth flow test complete' as result;
