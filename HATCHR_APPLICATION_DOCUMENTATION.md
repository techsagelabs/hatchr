# Hatchr - Complete Application Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture & Technology Stack](#architecture--technology-stack)
- [Installation & Setup](#installation--setup)
- [Features](#features)
- [Database Schema](#database-schema)
- [Authentication Migration: Clerk to Supabase](#authentication-migration-clerk-to-supabase)
- [Supabase Integration](#supabase-integration)
- [Deployment](#deployment)
- [Known Issues](#known-issues)
- [Critical Issue: Production Voting System Failure](#critical-issue-production-voting-system-failure)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

**Hatchr** is a modern web application built with Next.js that allows users to submit, discover, and vote on innovative projects. Similar to Product Hunt, it serves as a platform where creators can showcase their work and the community can engage through voting and comments.

### Key Information
- **Application Name**: Hatchr
- **Production URL**: https://hatchr.techsagelabs.in
- **Framework**: Next.js 15.2.4 with App Router
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (migrated from Clerk)
- **Deployment**: Vercel
- **Package Manager**: pnpm

---

## Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components built with Radix UI
- **State Management**: SWR for data fetching and caching
- **Real-time Updates**: Supabase Realtime subscriptions

### Backend & Infrastructure
- **Database**: PostgreSQL (Supabase hosted)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime
- **API**: Next.js API Routes (App Router)
- **Deployment**: Vercel

### Key Dependencies
```json
{
  "dependencies": {
    "next": "15.2.4",
    "react": "19.1.1",
    "@supabase/supabase-js": "^2.39.7",
    "@supabase/ssr": "^0.1.0",
    "@supabase/auth-ui-react": "^0.4.7",
    "swr": "^2.2.4",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- pnpm (preferred) or npm
- Supabase account
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Takeo-1
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Environment Variables**:
   Create a `.env.local` file with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Deployment URLs
   NEXT_PUBLIC_SITE_URL=https://hatchr.techsagelabs.in
   NEXT_PUBLIC_VERCEL_URL=your_vercel_url
   ```

4. **Database Setup**:
   Run the SQL migrations in your Supabase dashboard:
   - `supabase-migrations.sql`
   - `supabase-auth-migration.sql`
   - `create-auth-test-function.sql`

5. **Start development server**:
   ```bash
   pnpm dev
   ```

---

## Features

### Core Features
1. **User Authentication**
   - Email/password authentication
   - Google OAuth integration
   - Profile management with avatars
   - Onboarding flow for new users

2. **Project Management**
   - Submit new projects with images and descriptions
   - Edit existing projects (authors only)
   - Project categories and tagging
   - Rich media support (images, videos, code embeds)

3. **Voting System**
   - Upvote/downvote projects
   - Real-time vote count updates
   - User-specific vote tracking
   - Vote notifications for project authors

4. **Social Features**
   - User profiles with bio and social links
   - Connection system (follow/unfollow)
   - Comment system with threading
   - Notification system

5. **Real-time Updates**
   - Live vote updates
   - Real-time comments
   - Connection status updates
   - Notification alerts

### User Interface
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: ARIA compliant, keyboard navigation support

---

## Database Schema

### Core Tables

#### `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  media_url TEXT,
  code_embed_url TEXT,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  net_votes INTEGER DEFAULT 0,
  is_first_project BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `votes`
```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, user_id)
);
```

#### `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  website TEXT,
  twitter TEXT,
  github TEXT,
  linkedin TEXT,
  avatar_url TEXT,
  location TEXT,
  is_onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `connections`
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(requester_id, recipient_id)
);
```

#### `comments`
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `notifications`
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  actor_id TEXT,
  type notification_type NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Row Level Security (RLS) Policies

All tables implement comprehensive RLS policies to ensure data security:

- **Projects**: Public read, authenticated insert/update/delete for owners
- **Votes**: Public read, authenticated insert/update/delete for own votes
- **User Profiles**: Public read, authenticated insert/update for own profile
- **Connections**: Restricted read to involved users, authenticated operations
- **Comments**: Public read, authenticated insert, owner update/delete
- **Notifications**: Private read/update for notification recipients

---

## Authentication Migration: Clerk to Supabase

### Why We Migrated

**Original Authentication: Clerk**
- ✅ Easy setup and integration
- ✅ Good developer experience
- ❌ Additional service dependency
- ❌ Separate user management from database
- ❌ Extra complexity in RLS policies
- ❌ Cost considerations for scaling

**New Authentication: Supabase Auth**
- ✅ Integrated with database (PostgreSQL)
- ✅ Native RLS integration with `auth.uid()`
- ✅ Comprehensive authentication features
- ✅ Cost-effective scaling
- ✅ Real-time subscriptions integration
- ✅ Single provider for all backend services

### Migration Process

#### Phase 1: Preparation
1. **Database Schema Updates**:
   - Created Supabase auth users table integration
   - Updated RLS policies to use `auth.uid()` instead of Clerk user IDs
   - Migrated user data structure

2. **Environment Setup**:
   ```bash
   # Removed Clerk environment variables
   CLERK_PUBLISHABLE_KEY=removed
   CLERK_SECRET_KEY=removed
   
   # Added Supabase environment variables
   NEXT_PUBLIC_SUPABASE_URL=added
   NEXT_PUBLIC_SUPABASE_ANON_KEY=added
   SUPABASE_SERVICE_ROLE_KEY=added
   ```

#### Phase 2: Code Migration
1. **Authentication Context**:
   - Replaced `@clerk/nextjs` with custom `useAuth` hook
   - Created `lib/auth-context.tsx` for authentication state management
   - Updated all components using Clerk's `useUser` to use new context

2. **API Routes Updates**:
   - Replaced Clerk's `getAuth()` with Supabase's `getCurrentUser()`
   - Updated server-side authentication checks
   - Modified session handling for API routes

3. **UI Components Migration**:
   - Replaced Clerk's `<SignInButton>` with custom sign-in pages
   - Created dedicated `/sign-in` and `/sign-up` pages
   - Implemented Google OAuth with Supabase Auth

4. **Middleware Updates**:
   - Replaced Clerk middleware with Supabase Auth middleware
   - Updated route protection logic

#### Phase 3: Feature Additions
1. **Enhanced Authentication**:
   - Added password visibility toggle
   - Implemented Google Sign-In
   - Added proper error handling and user feedback
   - Created onboarding flow for new users

2. **Profile Management**:
   - Enhanced user profile features
   - Added social links integration
   - Improved avatar handling (Google profile images)

### Migration Challenges & Solutions

#### Challenge 1: User ID Format Changes
**Issue**: Clerk used string IDs, Supabase uses UUIDs
**Solution**: 
- Updated database schema to handle TEXT user IDs
- Maintained backward compatibility during transition
- Created data migration scripts

#### Challenge 2: RLS Policy Updates
**Issue**: RLS policies needed complete rewrite for `auth.uid()`
**Solution**:
```sql
-- Old Clerk-based policy
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (author_id = auth.jwt() ->> 'sub');

-- New Supabase-based policy  
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (author_id = auth.uid()::text);
```

#### Challenge 3: Session Management
**Issue**: Different session handling between Clerk and Supabase
**Solution**:
- Implemented proper server-side client creation
- Used `@supabase/ssr` package for Next.js integration
- Created centralized authentication utilities

---

## Supabase Integration

### Authentication Setup

#### Client-Side Authentication
```typescript
// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Server-Side Authentication
```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Real-time Features

#### Real-time Provider Setup
```typescript
// lib/realtime-provider.tsx
export function RealtimeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to projects table
    const projectsSubscription = supabase
      .channel('projects-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        handleProjectsChange
      )
      .subscribe()

    return () => {
      projectsSubscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}
```

### Storage Integration

#### Image Upload with Supabase Storage
```typescript
// components/ui/image-upload.tsx
const uploadImage = async (file: File) => {
  const supabase = createClient()
  const fileName = `${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from('project-assets')
    .upload(fileName, file)
    
  if (error) throw error
  
  const { data: urlData } = supabase.storage
    .from('project-assets')
    .getPublicUrl(fileName)
    
  return urlData.publicUrl
}
```

### Database Functions

#### Authentication Test Function
```sql
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
```

---

## Deployment

### Vercel Deployment Configuration

#### `vercel.json`
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "{{your_supabase_url}}",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "{{your_anon_key}}",
    "SUPABASE_SERVICE_ROLE_KEY": "{{your_service_key}}"
  }
}
```

#### Environment Variables Setup
1. **Supabase Configuration**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server operations

2. **URL Configuration**:
   - `NEXT_PUBLIC_SITE_URL`: Production domain (https://hatchr.techsagelabs.in)
   - `NEXT_PUBLIC_VERCEL_URL`: Vercel deployment URL

### Supabase Dashboard Configuration

#### Authentication Settings
1. **Site URL**: `https://hatchr.techsagelabs.in`
2. **Redirect URLs**: 
   - `https://hatchr.techsagelabs.in/auth/callback`
   - `http://localhost:3000/auth/callback` (development)

#### Google OAuth Setup
1. Configure Google OAuth provider in Supabase Auth
2. Add authorized origins and redirect URIs
3. Update Google Cloud Console settings

---

## Known Issues

### Resolved Issues
1. ✅ **Image Loading**: Fixed Google profile images and Supabase Storage images
2. ✅ **OAuth Redirects**: Fixed localhost redirects in production
3. ✅ **Deployment Errors**: Resolved missing Supabase Auth UI packages
4. ✅ **Project Submission**: Fixed async/await bug in project creation

### Minor Issues
- **Image Optimization**: Some external images bypass Next.js optimization
- **Real-time Connections**: Occasional reconnection delays
- **Mobile UI**: Minor responsive design improvements needed

---

## Critical Issue: Production Voting System Failure

### Issue Overview

**Status**: 🚨 **UNRESOLVED - CRITICAL**  
**Impact**: High - Core functionality broken in production  
**Environment**: Production only (works perfectly in development)  
**First Reported**: Multiple attempts to fix over several sessions  

### Symptoms

#### User Experience
- Users can authenticate and browse projects normally
- Vote buttons appear and respond to clicks
- **Critical**: Voting requests fail with HTTP 500 errors
- Error message: "Vote failed - voteProject returned null"
- No votes are recorded in the database

#### Error Details
```json
{
  "error": "Vote failed - voteProject returned null",
  "details": "This is usually caused by Row Level Security policies blocking the vote operation",
  "production_debug": {
    "user_id": "5b182f29-8589-4cd5-9f55-0267558cd357",
    "project_id": "test-project-id", 
    "direction": "up",
    "timestamp": "2025-09-28T21:35:44.903Z",
    "auth_check": {
      "has_user": true,
      "user_id": "5b182f29-8589-4cd5-9f55-0267558cd357",
      "user_email": "techsage.contact@gmail.com"
    }
  }
}
```

### Technical Analysis

#### What Works ✅
1. **User Authentication**: Perfect authentication in production
2. **JWT Token Generation**: Valid tokens with correct claims
3. **RPC Functions**: `auth_uid_test()` returns correct user ID
4. **Database Connectivity**: Basic database operations function
5. **Local Development**: All voting functionality works flawlessly locally

#### What Fails ❌
1. **Table Operations in Production**: SELECT/INSERT/UPDATE operations fail
2. **RLS Context for Tables**: `auth.uid()` returns null for table operations
3. **Vote Recording**: No votes are saved to the database
4. **Service Client Fallback**: Even service role client operations fail

#### Environment Comparison

| Aspect | Local Development | Production |
|--------|------------------|------------|
| Authentication | ✅ Works | ✅ Works |
| RPC Functions | ✅ Works | ✅ Works |
| Table Operations | ✅ Works | ❌ Fails |
| JWT Token Validity | ✅ Valid | ✅ Valid |
| Database Connection | ✅ Connected | ❌ Disconnected |

### Root Cause Analysis

#### Primary Hypothesis: JWT Token Context Loss
The issue appears to be that while JWT tokens are valid and work for RPC functions, they lose authentication context when used for table operations (SELECT, INSERT, UPDATE) in the production environment.

#### Evidence Supporting This Theory:
1. **Debug Output Shows**:
   ```json
   {
     "authFunction": { "working": true },
     "supabase": { "connected": false }
   }
   ```

2. **RLS Policies Work Locally**: Same policies that work in development fail in production
3. **Service Client Fails Too**: Even bypassing regular auth with service role fails
4. **Environment Variables**: All properly configured in Vercel

#### Server-Side Client Configuration Issues
```typescript
// Current implementation
const supabase = await createServerSupabaseClient() // Uses cookies
// Issue: Cookie-based auth may not work properly in Vercel serverless functions

// Attempted fix
const authenticatedSupabase = createClientForApiRoute(req) // Uses JWT headers
// Issue: JWT forwarding may not be working as expected
```

### Attempted Solutions

#### Solution 1: RLS Policy Cleanup ✅ Completed
- Removed all conflicting Clerk-era RLS policies
- Created clean Supabase Auth policies using `auth.uid()::text`
- Verified policies are active and correctly structured

#### Solution 2: JWT Token Forwarding 🔄 Recently Implemented
- Added `createClientForApiRoute()` function to extract JWT from headers
- Modified vote API route to use JWT-authenticated Supabase client
- Updated client-side to send JWT tokens in Authorization headers

**Implementation**:
```typescript
// Client sends JWT token
const { data: { session } } = await supabase.auth.getSession()
const headers = {
  'Authorization': `Bearer ${session.access_token}`
}

// Server extracts and uses JWT token
const authenticatedSupabase = createClientForApiRoute(req)
const result = await voteProject(id, direction, authenticatedSupabase)
```

#### Solution 3: Service Client Fallback ⚠️ Partial Implementation
- Created service role client as backup when regular client fails
- Added manual user ID validation for security
- Issue: Service client also fails in production

#### Solution 4: Debug Infrastructure ✅ Completed
- Added comprehensive debugging endpoints (`/debug-urls`, `/api/debug/environment`)
- Created step-by-step logging in vote operations
- Implemented auth context testing functions

### Current Debug Information

#### Authentication Context Test Results
```json
{
  "authFunction": {
    "working": true,
    "uid": {
      "auth_uid": "5b182f29-8589-4cd5-9f55-0267558cd357",
      "auth_role": "authenticated", 
      "has_auth_uid": true
    }
  }
}
```

#### Database Connection Test Results
```json
{
  "supabase": {
    "connected": false,
    "error": "Table operation failed"
  }
}
```

### Next Steps for Resolution

#### Immediate Actions Needed

1. **Deploy Latest JWT Forwarding Fix**:
   ```bash
   git add -A
   git commit -m "🚀 JWT token forwarding implementation"
   git push
   ```

2. **Test JWT Token Flow**:
   - Verify JWT tokens are being sent from client
   - Confirm API routes receive JWT in headers
   - Check if authenticated Supabase client is created properly

3. **Investigate Vercel-Specific Issues**:
   - Check if Vercel serverless functions have issues with Supabase SSR
   - Verify environment variable propagation
   - Test if cookie handling works properly in Vercel

#### Alternative Solutions to Consider

#### Option A: Direct Database Approach
Instead of relying on Supabase client, use direct PostgreSQL connection:
```typescript
import { Pool } from 'pg'

const pool = new Pool({ connectionString: DATABASE_URL })
const client = await pool.connect()

// Direct SQL with explicit user context
await client.query(`
  SET request.jwt.claims = '${JSON.stringify(userClaims)}';
  INSERT INTO votes (project_id, user_id, vote_type) 
  VALUES ($1, $2, $3);
`, [projectId, userId, voteType])
```

#### Option B: Supabase-JS Alternative Configuration
Try alternative Supabase client configuration specifically for Vercel:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY, // Use service role
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Manually set auth context
supabase.auth.setSession({ 
  access_token: userJWT,
  refresh_token: null 
})
```

#### Option C: API Route Restructure
Restructure vote API to handle authentication differently:
```typescript
export async function POST(req: Request) {
  // Get user from cookies (Vercel-optimized)
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role with manual user validation
  const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  
  // Perform operation with service role but validate user permissions
  const { data, error: voteError } = await adminSupabase
    .from('votes')
    .insert({
      project_id: projectId,
      user_id: user.id, // Validated user from JWT
      vote_type: direction
    })
  
  return NextResponse.json(data)
}
```

### Testing Strategy

#### Comprehensive Testing Plan
1. **Local Testing**: Ensure all fixes work in development
2. **Production Deployment**: Deploy with comprehensive logging
3. **Manual Testing**: Test voting functionality with real user account
4. **Debug Analysis**: Review production logs for detailed error information
5. **Fallback Testing**: Test alternative approaches if primary solution fails

#### Success Criteria
- ✅ Users can successfully vote on projects in production
- ✅ Votes are properly recorded in database
- ✅ Real-time updates work correctly
- ✅ Vote notifications are sent to project authors
- ✅ No console errors or failed API requests

### Impact Assessment

#### Business Impact
- **High**: Core functionality is broken for all production users
- **User Experience**: Users cannot engage with primary app feature
- **Retention**: May impact user retention and engagement metrics
- **Reputation**: Affects app reliability and user trust

#### Technical Debt
- Multiple attempted fixes have added complexity
- Debug infrastructure needs cleanup after resolution
- RLS policies may need optimization
- Error handling requires improvement

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "JWT Expired" Errors
**Solution**: 
- Check if session refresh is working properly
- Verify JWT expiration handling in middleware
- Ensure proper token refresh in auth context

#### Issue: RLS Policy Violations
**Solution**:
```sql
-- Check active policies
SELECT * FROM pg_policies WHERE tablename = 'votes';

-- Test auth context
SELECT auth.uid(), auth.role();

-- Verify user authentication
SELECT * FROM auth.users WHERE id = auth.uid();
```

#### Issue: Real-time Subscription Failures
**Solution**:
- Check Supabase project limits
- Verify connection pooling settings  
- Review network connectivity

#### Issue: Image Upload Failures
**Solution**:
- Verify Supabase Storage policies
- Check file size and type restrictions
- Ensure proper bucket configuration

### Debug Utilities

#### Authentication Debug Endpoint
`GET /api/debug/environment`
- Returns authentication status
- Shows environment variable configuration  
- Tests database connectivity

#### URL Debug Page
`/debug-urls`
- Displays URL resolution in production
- Tests authentication flow
- Provides voting API test interface

### Performance Monitoring

#### Key Metrics to Monitor
- **API Response Times**: Vote API should respond < 500ms
- **Database Query Performance**: Monitor slow queries
- **Real-time Connection Health**: Track subscription status
- **Error Rates**: Monitor 4xx/5xx error rates

#### Optimization Recommendations
1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
3. **Caching Strategy**: Implement appropriate caching for read-heavy operations
4. **Connection Pooling**: Monitor and optimize database connections

---

## Conclusion

Hatchr represents a modern, full-stack Next.js application with comprehensive features for project sharing and community engagement. The migration from Clerk to Supabase Auth has streamlined the architecture and provided better integration with the PostgreSQL database.

**Current Status**: The application is fully functional in development and mostly functional in production, with the critical voting system issue being the primary blocker for full production readiness.

**Priority**: Resolving the production voting issue is the highest priority, as it affects the core user experience and engagement features of the platform.

The technical implementation demonstrates best practices in:
- Modern React patterns with hooks and context
- Server-side rendering with Next.js App Router
- Comprehensive authentication and authorization
- Real-time features and responsive UI design
- Proper database design with RLS security

Once the voting issue is resolved, Hatchr will be a robust, scalable platform ready for production use and further feature development.

---

**Last Updated**: December 28, 2025  
**Version**: 1.0  
**Status**: Production deployment with critical voting issue pending resolution
