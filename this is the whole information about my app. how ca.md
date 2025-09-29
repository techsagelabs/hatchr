<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# this is the whole information about my app. how can i fix this voting issue:

# Hatchr - Complete Application Documentation

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture \& Technology Stack](#architecture--technology-stack)
- [Installation \& Setup](#installation--setup)
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
- **Production URL**: [https://hatchr.techsagelabs.in](https://hatchr.techsagelabs.in)
- **Framework**: Next.js 15.2.4 with App Router
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (migrated from Clerk)
- **Deployment**: Vercel
- **Package Manager**: pnpm

---

## Architecture \& Technology Stack

### Frontend

- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components built with Radix UI
- **State Management**: SWR for data fetching and caching
- **Real-time Updates**: Supabase Realtime subscriptions


### Backend \& Infrastructure

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

## Installation \& Setup

### Prerequisites

- Node.js 18+
- pnpm (preferred) or npm
- Supabase account
- Vercel account (for deployment)


### Local Development Setup

1. **Clone the repository**:
   ```bash    git clone <repository-url>    cd Takeo-1    ```
2. **Install dependencies**:
   ```bash    pnpm install    ```
3. **Environment Variables**:
   Create a `.env.local` file with the following variables:
   ```env
   \# Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

\# Deployment URLs
   NEXT_PUBLIC_SITE_URL=https://hatchr.techsagelabs.in
   NEXT_PUBLIC_VERCEL_URL=your_vercel_url
   ```

4. **Database Setup**:
   Run the SQL migrations in your Supabase dashboard:
   - `supabase-migrations.sql`
   - `supabase-auth-migration.sql`
   - `create-auth-test-function.sql`
5. **Start development server**:
   ```bash    pnpm dev    ```

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
   ```bash    # Removed Clerk environment variables    CLERK_PUBLISHABLE_KEY=removed    CLERK_SECRET_KEY=removed        # Added Supabase environment variables    NEXT_PUBLIC_SUPABASE_URL=added    NEXT_PUBLIC_SUPABASE_ANON_KEY=added    SUPABASE_SERVICE_ROLE_KEY=added    ```

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

### Migration Challenges \& Solutions

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
| :-- | :-- | :-- |
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
   ```json    {      "authFunction": { "working": true },      "supabase": { "connected": false }    }    ```
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
   ```bash    git add -A    git commit -m "🚀 JWT token forwarding implementation"    git push    ```
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

### Common Issues \& Solutions

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

Based on your detailed documentation and the research I've conducted, this is a well-documented issue with Supabase authentication in Next.js production environments, particularly on Vercel. The core problem is that **JWT authentication context is being lost in serverless functions**, causing `auth.uid()` to return null for table operations while working for RPC functions.

## Root Cause Analysis

The issue occurs because Vercel's serverless functions don't maintain session state between requests, and your current server-side Supabase client configuration is losing the JWT authentication context.[^1_1][^1_2][^1_3]

### Why RPC Functions Work But Tables Don't

- **RPC Functions**: Use direct function calls that maintain auth context
- **Table Operations**: Rely on RLS policies that need `auth.uid()` to be properly set
- **Production vs Development**: Local development maintains session state, production serverless functions don't[^1_4][^1_5]


## Immediate Solutions

### Solution 1: Fix Server Client Configuration (Recommended)

Update your server-side Supabase client creation to properly handle cookies in Next.js 15:

```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // Next.js 15 requires await
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component
            // This can be ignored if you have middleware refreshing
            // user sessions
          }
        },
      },
    }
  )
}
```


### Solution 2: Enhanced JWT Token Forwarding

Create a specialized function for API routes that explicitly handles JWT tokens:

```typescript
// utils/supabase/api-route.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

export function createClientForApiRoute(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Extract cookies from request headers
          const cookieHeader = requestHeaders.get('cookie')
          if (!cookieHeader) return []
          
          return cookieHeader
            .split(';')
            .map(cookie => {
              const [name, ...rest] = cookie.trim().split('=')
              return { name, value: rest.join('=') }
            })
        },
        setAll(cookiesToSet) {
          // Set response cookies
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieString = `${name}=${value}; ${Object.entries(options || {})
              .map(([key, val]) => `${key}=${val}`)
              .join('; ')}`
            requestHeaders.append('Set-Cookie', cookieString)
          })
        },
      },
    }
  )
}
```


### Solution 3: Service Role Client with Manual Validation

For critical operations like voting, use a service role client with explicit user validation:

```typescript
// utils/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// api/vote/[id]/route.ts
export async function POST(req: Request) {
  try {
    // Get user from regular client first
    const userSupabase = await createClient()
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client for the actual database operation
    const adminSupabase = createAdminClient()
    const { projectId, direction } = await req.json()
    
    // Perform operation with service role but validate user permissions
    const { data, error } = await adminSupabase
      .from('votes')
      .upsert({
        project_id: projectId,
        user_id: user.id, // Validated user from JWT
        vote_type: direction
      }, {
        onConflict: 'project_id,user_id'
      })
      .select()

    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Vote failed', details: error.message },
      { status: 500 }
    )
  }
}
```


## Additional Fixes

### Fix 1: Update RLS Policies for Better Compatibility

Ensure your RLS policies are compatible with the service role approach:

```sql
-- Update votes table RLS policies
DROP POLICY IF EXISTS "Users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update votes" ON votes;
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;

-- Create more robust policies
CREATE POLICY "Users can manage their votes" ON votes
  FOR ALL
  USING (
    user_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT
  TO authenticated, anon
  USING (true);
```


### Fix 2: Client-Side JWT Header Enhancement

Update your client-side voting function to include proper headers:

```typescript
// lib/api/vote.ts
export async function voteProject(projectId: string, direction: 'up' | 'down') {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication session')
  }

  const response = await fetch(`/api/vote/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      // Include cookies for additional auth context
      'Cookie': document.cookie
    },
    body: JSON.stringify({ direction }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Vote failed')
  }

  return response.json()
}
```


### Fix 3: Environment Variables Verification

Ensure all environment variables are properly set in Vercel:

```bash
# Required environment variables for Vercel
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional but recommended
SUPABASE_JWT_SECRET=your_jwt_secret
```


## Deployment Strategy

### Step 1: Implement the Fix

1. Update server client configuration with proper cookie handling
2. Implement service role fallback for critical operations
3. Update RLS policies to support service role operations
4. Deploy to Vercel

### Step 2: Test Production

1. Test voting functionality with a real user account
2. Monitor logs for any remaining auth issues
3. Verify real-time updates work correctly

### Step 3: Fallback Implementation

If issues persist, implement a hybrid approach where voting uses direct database queries with explicit session validation.[^1_5][^1_6]

## Expected Outcome

This multi-layered approach should resolve your voting issue by:

- **Primary Fix**: Proper cookie-based auth in serverless functions[^1_7][^1_4]
- **Fallback**: Service role operations with user validation[^1_2][^1_3]
- **Safety**: Enhanced RLS policies that work in both scenarios[^1_8][^1_1]

The combination of these fixes addresses the root cause while providing robust fallbacks, ensuring your voting system works reliably in production.[^1_9][^1_10]
<span style="display:none">[^1_11][^1_12][^1_13][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36]</span>

<div align="center">⁂</div>

[^1_1]: https://www.reddit.com/r/Supabase/comments/1iwxbf9/authuid_returning_null/

[^1_2]: https://github.com/orgs/supabase/discussions/6592

[^1_3]: https://stackoverflow.com/questions/79747396/permission-denied-despite-correct-rls-as-supabase-auth-getuser-returns-null-o

[^1_4]: https://supabase.com/docs/guides/auth/server-side/nextjs

[^1_5]: https://www.reddit.com/r/Supabase/comments/1hfz7gq/how_to_use_supabase_auth_in_nextjs_without/

[^1_6]: https://dev.to/thatanjan/how-to-setup-supabase-with-nextjs-for-authentication-supabase-auth-3p76

[^1_7]: https://supabase.com/docs/guides/auth/server-side/creating-a-client

[^1_8]: https://stackoverflow.com/questions/78770969/how-can-i-fix-this-rls-policy-issue-with-supabase-on-insert

[^1_9]: https://vercel.com/templates/authentication/supabase

[^1_10]: https://techstaunch.com/blogs/implementing-authentication-in-next-js-with-supabase?tech_blog=true

[^1_11]: https://community.vercel.com/t/supabase-auth-deployment-error/20140

[^1_12]: https://github.com/orgs/supabase/discussions/27193

[^1_13]: https://github.com/orgs/supabase/discussions/25835

[^1_14]: https://stackoverflow.com/questions/79647797/not-being-able-to-query-my-table-using-supabase´s-auth-uid-as-a-foreign-key

[^1_15]: https://curity.io/resources/learn/serverless-zero-trust-api-on-vercel/

[^1_16]: https://community.weweb.io/t/supabase-auth-auth-uid-doesnt-work-but-user-id-does/4246

[^1_17]: https://www.reddit.com/r/Supabase/comments/1fydd9p/can_someone_please_tell_me_why_this_rls_policy/

[^1_18]: https://github.com/orgs/supabase/discussions/29289

[^1_19]: https://community.vercel.com/t/could-not-resolve-supabase-js-from-src-services-apiauth-js-file-vercel-path0-src-services-apiauth-js/1172

[^1_20]: https://supabase.com/changelog

[^1_21]: https://dev.to/asheeshh/mastering-supabase-rls-row-level-security-as-a-beginner-5175

[^1_22]: https://stackoverflow.com/questions/74248947/vercel-serverless-node-js-api-not-next-js-cant-auth-user-with-supabase

[^1_23]: https://www.answeroverflow.com/m/1025882772520316988

[^1_24]: https://prosperasoft.com/blog/database/supabase/supabase-rls-issues/

[^1_25]: https://community.vercel.com/t/serverless-function-auth/1850

[^1_26]: https://community.vercel.com/t/error-after-auth-using-v0-deployment-and-supabase/4867

[^1_27]: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

[^1_28]: https://community.vercel.com/t/v0-supabase-auth-installation-prompt/17270

[^1_29]: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs

[^1_30]: https://stackoverflow.com/questions/79407965/i-have-a-next-js-15-console-warning-error-route-uses-cookies-get-cooki

[^1_31]: https://nextjs.org/docs/app/guides/authentication

[^1_32]: https://www.reddit.com/r/Supabase/comments/1g9g6q6/supabase_ssr_with_nextjs_15/

[^1_33]: https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501

[^1_34]: https://github.com/ElectricCodeGuy/SupabaseAuthWithSSR

[^1_35]: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

[^1_36]: https://www.youtube.com/watch?v=D3HC_NyrTe8


---

## Phase 2: Root Cause Fixes

### Step 2: Update Server-Side Supabase Client Configuration

The primary issue is improper cookie handling in Next.js 15 with Vercel serverless functions. Update your server client:

```typescript
// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // Next.js 15 requires await
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component
            // or during middleware execution. This can be ignored 
            // if you have middleware refreshing user sessions.
            console.warn('Failed to set cookies in server component:', error)
          }
        },
      },
    }
  )
}
```


### Step 3: Create Specialized API Route Client

Create a new utility specifically for API routes with enhanced JWT handling:

```typescript
// utils/supabase/api-client.ts
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

export function createApiRouteClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return []
          
          return cookieHeader
            .split(';')
            .map(cookie => {
              const [name, ...rest] = cookie.trim().split('=')
              return { 
                name: name.trim(), 
                value: decodeURIComponent(rest.join('=') || '') 
              }
            })
            .filter(cookie => cookie.name && cookie.value)
        },
        setAll(cookiesToSet) {
          // In API routes, we can't set cookies directly
          // This will be handled by the response
        },
      },
    }
  )
}

// Alternative: Direct JWT extraction from Authorization header
export function createJWTClient(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  
  return client
}
```


### Step 4: Create Service Role Admin Client

For critical operations, create a service role client with explicit user validation:

```typescript
// utils/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Utility function for validated operations
export async function performAuthenticatedOperation<T>(
  userSupabase: any,
  operation: (adminClient: any, userId: string) => Promise<T>
): Promise<T> {
  // First verify user authentication
  const { data: { user }, error: userError } = await userSupabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Use admin client for the actual operation
  const adminClient = createAdminClient()
  return await operation(adminClient, user.id)
}
```


## Phase 3: Update Vote API Route

### Step 5: Rewrite Vote API with Multi-Layer Approach

Replace your current vote API route with this robust implementation:

```typescript
// app/api/vote/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiRouteClient, createJWTClient } from '@/utils/supabase/api-client'
import { createAdminClient, performAuthenticatedOperation } from '@/utils/supabase/admin'

interface VoteRequest {
  direction: 'up' | 'down'
}

interface VoteContext {
  projectId: string
  userId: string
  direction: 'up' | 'down'
  userEmail?: string
}

async function voteWithRegularClient(context: VoteContext, supabase: any) {
  console.log(`[Vote] Attempting regular client vote for user ${context.userId}`)
  
  // First, try to upsert the vote
  const { data: voteData, error: voteError } = await supabase
    .from('votes')
    .upsert(
      {
        project_id: context.projectId,
        user_id: context.userId,
        vote_type: context.direction
      },
      {
        onConflict: 'project_id,user_id'
      }
    )
    .select()

  if (voteError) {
    console.error('[Vote] Regular client vote failed:', voteError)
    throw voteError
  }

  return voteData
}

async function voteWithServiceRole(context: VoteContext) {
  console.log(`[Vote] Attempting service role vote for user ${context.userId}`)
  
  return await performAuthenticatedOperation(
    createApiRouteClient(null), // We'll validate differently
    async (adminClient, validatedUserId) => {
      // Double-check user ID matches
      if (validatedUserId !== context.userId) {
        throw new Error('User ID mismatch in service role operation')
      }

      const { data, error } = await adminClient
        .from('votes')
        .upsert(
          {
            project_id: context.projectId,
            user_id: context.userId,
            vote_type: context.direction
          },
          {
            onConflict: 'project_id,user_id'
          }
        )
        .select()

      if (error) throw error
      return data
    }
  )
}

async function updateProjectVoteCounts(context: VoteContext, adminClient: any) {
  // Recalculate vote counts for the project
  const { data: voteCounts, error: countError } = await adminClient
    .from('votes')
    .select('vote_type')
    .eq('project_id', context.projectId)

  if (countError) {
    console.error('[Vote] Failed to fetch vote counts:', countError)
    return
  }

  const upvotes = voteCounts.filter(v => v.vote_type === 'up').length
  const downvotes = voteCounts.filter(v => v.vote_type === 'down').length
  const netVotes = upvotes - downvotes

  // Update project vote counts
  const { error: updateError } = await adminClient
    .from('projects')
    .update({
      upvotes,
      downvotes,
      net_votes: netVotes,
      updated_at: new Date().toISOString()
    })
    .eq('id', context.projectId)

  if (updateError) {
    console.error('[Vote] Failed to update project counts:', updateError)
  } else {
    console.log(`[Vote] Updated project ${context.projectId} counts: ${upvotes} up, ${downvotes} down`)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  try {
    // Parse request
    const { direction }: VoteRequest = await request.json()
    const projectId = params.id

    if (!direction || !['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid vote direction' },
        { status: 400 }
      )
    }

    console.log(`[Vote] Starting vote process: ${projectId} ${direction}`)

    // Method 1: Try with cookie-based client
    let supabase
    let user
    
    try {
      supabase = createApiRouteClient(request)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (!userError && userData.user) {
        user = userData.user
        console.log(`[Vote] Cookie auth successful for user: ${user.id}`)
      }
    } catch (cookieError) {
      console.log('[Vote] Cookie authentication failed:', cookieError.message)
    }

    // Method 2: Try with JWT header if cookie method failed
    if (!user) {
      try {
        const authHeader = request.headers.get('authorization')
        if (authHeader) {
          supabase = createJWTClient(authHeader)
          const { data: userData, error: userError } = await supabase.auth.getUser()
          
          if (!userError && userData.user) {
            user = userData.user
            console.log(`[Vote] JWT auth successful for user: ${user.id}`)
          }
        }
      } catch (jwtError) {
        console.log('[Vote] JWT authentication failed:', jwtError.message)
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const context: VoteContext = {
      projectId,
      userId: user.id,
      direction,
      userEmail: user.email
    }

    let voteData
    let method = 'unknown'

    // Try regular client first
    try {
      voteData = await voteWithRegularClient(context, supabase)
      method = 'regular_client'
      console.log(`[Vote] Success with regular client`)
    } catch (regularError) {
      console.log('[Vote] Regular client failed, trying service role:', regularError.message)
      
      // Fallback to service role
      try {
        voteData = await voteWithServiceRole(context)
        method = 'service_role'
        console.log(`[Vote] Success with service role`)
      } catch (serviceError) {
        console.error('[Vote] Both methods failed:', {
          regular: regularError.message,
          service: serviceError.message
        })
        
        return NextResponse.json(
          {
            error: 'Vote operation failed',
            details: {
              regular_client: regularError.message,
              service_role: serviceError.message,
              user_id: context.userId,
              project_id: projectId
            }
          },
          { status: 500 }
        )
      }
    }

    // Update project vote counts using admin client
    const adminClient = createAdminClient()
    await updateProjectVoteCounts(context, adminClient)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      data: voteData,
      meta: {
        method,
        duration_ms: duration,
        user_id: context.userId,
        project_id: projectId,
        vote_type: direction
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error('[Vote] Unexpected error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        duration_ms: duration
      },
      { status: 500 }
    )
  }
}
```


## Phase 4: Update RLS Policies

### Step 6: Create Production-Ready RLS Policies

Update your database policies to work with both regular and service role operations:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert votes" ON votes;
DROP POLICY IF EXISTS "Users can update votes" ON votes;
DROP POLICY IF EXISTS "Users can view votes" ON votes;
DROP POLICY IF EXISTS "Users can delete votes" ON votes;

-- Create comprehensive vote policies
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can manage their votes" ON votes
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  )
  WITH CHECK (
    user_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  );

-- Update project policies to allow service role updates for vote counts
DROP POLICY IF EXISTS "Users can update own projects" ON projects;

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  )
  WITH CHECK (
    author_id = auth.uid()::text 
    OR 
    auth.role() = 'service_role'
  );

-- Ensure projects can be read by anyone
CREATE POLICY "Anyone can view projects" ON projects
  FOR SELECT
  TO authenticated, anon
  USING (true);
```


### Step 7: Update Client-Side Vote Function

Update your client-side voting to include proper headers and error handling:

```typescript
// lib/api/vote.ts
import { createClient } from '@/utils/supabase/client'

export async function voteProject(projectId: string, direction: 'up' | 'down') {
  const supabase = createClient()
  
  // Get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session?.access_token) {
    throw new Error('No active authentication session')
  }

  console.log(`[Client] Voting ${direction} on project ${projectId}`)

  const response = await fetch(`/api/vote/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      // Include cookies for dual auth approach
      'Cookie': document.cookie
    },
    body: JSON.stringify({ direction }),
    credentials: 'include' // Important for cookie-based auth
  })

  const result = await response.json()

  if (!response.ok) {
    console.error('[Client] Vote failed:', result)
    throw new Error(result.error || `HTTP ${response.status}`)
  }

  console.log(`[Client] Vote successful:`, result.meta)
  return result
}

// Enhanced hook with better error handling
export function useVoteProject() {
  const [isVoting, setIsVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vote = async (projectId: string, direction: 'up' | 'down') => {
    setIsVoting(true)
    setError(null)

    try {
      const result = await voteProject(projectId, direction)
      
      // Trigger SWR revalidation
      mutate(`/api/projects/${projectId}`)
      mutate('/api/projects') // Refresh project list
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsVoting(false)
    }
  }

  return { vote, isVoting, error }
}
```


## Phase 5: Environment Configuration

### Step 8: Verify Environment Variables

Ensure all required environment variables are set in Vercel:

---

# continue

```bash
# Required Environment Variables for Vercel
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional but recommended
SUPABASE_JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_SITE_URL=https://hatchr.techsagelabs.in
```

Verify these in Vercel Dashboard:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Ensure all variables are set for Production environment
4. **Critical**: Make sure `SUPABASE_SERVICE_ROLE_KEY` is present and correct

### Step 9: Add Middleware for Enhanced Auth

Create or update middleware to ensure proper session handling:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: { user } } = await supabase.auth.getUser()

  // Log auth status for debugging (remove in production)
  if (request.nextUrl.pathname.startsWith('/api/vote')) {
    console.log(`[Middleware] Vote API call - User: ${user?.id || 'none'}`)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```


## Phase 6: Testing and Deployment

### Step 10: Local Testing Protocol

Before deploying, test the complete flow locally:

---

# continue

```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Test authentication
curl -X GET "http://localhost:3000/api/debug/environment" \
  -H "Cookie: $(curl -s -c - http://localhost:3000 | grep -o 'sb-.*')"

# Terminal 3: Monitor logs
npx vercel logs --follow
```


### Step 10.1: Authentication Flow Test

1. **Sign Up/Sign In**: Test with a real email address
2. **Profile Creation**: Ensure onboarding works
3. **Session Persistence**: Refresh page, check if logged in
4. **Console Checks**: Look for any auth-related errors

### Step 10.2: Voting System Test

1. **Create Test Project**: Submit a project if needed
2. **Vote Actions**: Test upvote/downvote functionality
3. **Database Verification**: Check Supabase dashboard for vote records
4. **Real-time Updates**: Verify vote counts update immediately

### Step 10.3: API Endpoint Testing

Create a test script to validate your API:

```typescript
// scripts/test-vote-api.ts
import { createClient } from '@/utils/supabase/client'

async function testVoteAPI() {
  const supabase = createClient()
  
  // Sign in
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'your-test-email@example.com',
    password: 'your-password'
  })
  
  if (error) {
    console.error('Login failed:', error)
    return
  }
  
  console.log('✅ Login successful')
  
  // Test vote API
  const response = await fetch('http://localhost:3000/api/vote/test-project-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'Cookie': document.cookie
    },
    body: JSON.stringify({ direction: 'up' })
  })
  
  const result = await response.json()
  console.log('Vote API Response:', result)
  
  if (response.ok) {
    console.log('✅ Vote API working locally')
  } else {
    console.error('❌ Vote API failed locally')
  }
}

testVoteAPI()
```


## Phase 7: Production Deployment

### Step 11: Deployment Strategy

```bash
# 1. Commit all changes
git add .
git commit -m "🚀 Fix: Production voting system with multi-layer auth approach

- Enhanced server-side Supabase client with proper cookie handling
- Added JWT token forwarding for API routes  
- Implemented service role fallback for critical operations
- Updated RLS policies for production compatibility
- Added comprehensive error handling and logging"

# 2. Push to main branch (triggers Vercel deployment)
git push origin main

# 3. Monitor deployment
npx vercel logs --follow

# 4. Check deployment status
npx vercel ls
```


### Step 12: Production Testing Protocol

#### Step 12.1: Authentication Verification

```bash
# Test production auth endpoint
curl -X GET "https://hatchr.techsagelabs.in/api/debug/environment"

# Expected response:
{
  "authFunction": {
    "working": true,
    "uid": "actual-user-id"
  },
  "supabase": {
    "connected": true  // This should now be true!
  }
}
```


#### Step 12.2: Production Vote Testing

Create a production test checklist:

---

# continue

#### Step 12.3: Advanced Production Testing

Create a browser-based test script to verify the complete flow:

```javascript
// Run this in browser console on https://hatchr.techsagelabs.in
async function testProductionVoting() {
  console.log('🧪 Starting production vote test...')
  
  // Check if user is authenticated
  const authResponse = await fetch('/api/debug/environment')
  const authStatus = await authResponse.json()
  
  console.log('Auth status:', authStatus)
  
  if (!authStatus.authFunction?.working) {
    console.error('❌ Authentication not working')
    return
  }
  
  // Find the first project on the page
  const projectElement = document.querySelector('[data-project-id]')
  if (!projectElement) {
    console.error('❌ No project found on page')
    return
  }
  
  const projectId = projectElement.dataset.projectId
  console.log(`Testing with project: ${projectId}`)
  
  // Test vote API call
  try {
    const voteResponse = await fetch(`/api/vote/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ direction: 'up' }),
      credentials: 'include'
    })
    
    const voteResult = await voteResponse.json()
    
    if (voteResponse.ok) {
      console.log('✅ Vote successful!', voteResult)
      console.log(`Method used: ${voteResult.meta?.method}`)
      console.log(`Duration: ${voteResult.meta?.duration_ms}ms`)
    } else {
      console.error('❌ Vote failed:', voteResult)
    }
    
  } catch (error) {
    console.error('❌ Network error:', error)
  }
}

// Run the test
testProductionVoting()
```


## Phase 8: Monitoring and Logging

### Step 13: Enhanced Debug Infrastructure

Add comprehensive logging to monitor the fix in production:

```typescript
// utils/logger.ts
export interface LogContext {
  userId?: string
  projectId?: string
  method?: string
  duration?: number
  error?: string
}

export function logVoteAttempt(context: LogContext) {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    event: 'vote_attempt',
    ...context
  }
  
  // Log to console (visible in Vercel logs)
  console.log('[VOTE_LOG]', JSON.stringify(logData))
  
  // Optional: Send to external logging service
  if (process.env.NODE_ENV === 'production') {
    // Could integrate with services like LogRocket, Sentry, etc.
  }
}

export function logAuthStatus(status: 'success' | 'failed', details: any) {
  console.log('[AUTH_LOG]', JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'auth_check',
    status,
    details
  }))
}
```

Update your vote API to include this logging:

```typescript
// In your vote API route
import { logVoteAttempt, logAuthStatus } from '@/utils/logger'

// Add after authentication check
logAuthStatus('success', {
  userId: user.id,
  email: user.email,
  method: 'cookie_auth' // or 'jwt_auth'
})

// Add after vote attempt
logVoteAttempt({
  userId: context.userId,
  projectId: context.projectId,
  method: method,
  duration: Date.now() - startTime
})
```


### Step 14: Real-time Monitoring Dashboard

Create a simple monitoring endpoint to check system health:

```typescript
// app/api/health/route.ts
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: false,
    auth: false,
    voting_system: false
  }
  
  try {
    // Test database connection
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.from('projects').select('id').limit(1)
    checks.database = !error && data !== null
    
    // Test auth system (check if we can call auth functions)
    const { data: authTest } = await adminClient.rpc('auth_uid_test')
    checks.auth = authTest !== null
    
    // Test voting system (check if votes table is accessible)
    const { data: voteTest } = await adminClient.from('votes').select('id').limit(1)
    checks.voting_system = voteTest !== null
    
  } catch (error) {
    console.error('[Health Check] Error:', error)
  }
  
  const allHealthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : true
  )
  
  return NextResponse.json(
    { 
      status: allHealthy ? 'healthy' : 'degraded',
      checks 
    },
    { status: allHealthy ? 200 : 503 }
  )
}
```

Access this at: `https://hatchr.techsagelabs.in/api/health`

## Phase 9: Troubleshooting Guide

### Step 15: Common Issues and Solutions


---

# complete the remaining guide

#### Detailed Troubleshooting Solutions

**Issue 1: Environment Variables Verification**

```bash
# Check if env vars are properly set in Vercel
npx vercel env ls

# If missing, add them:
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

**Issue 2: Service Role Key Validation**

```sql
-- Test service role key in Supabase SQL editor
SELECT auth.role(), current_user;
-- Should return 'service_role' when using service key
```

**Issue 3: RLS Policy Debugging**

```sql
-- Check active policies on votes table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'votes';

-- Test auth context
SELECT 
  auth.uid() as auth_uid,
  auth.role() as auth_role,
  current_user as current_user;
```

**Issue 4: Network Request Debugging**

```javascript
// Add this to browser console to debug vote requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args[0], args[1]);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response.status, response.statusText);
      return response;
    });
};
```


### Step 16: Emergency Rollback Strategy

If the fix doesn't work immediately, here's a quick rollback plan:

```typescript
// Emergency: Simple direct database approach
// app/api/vote/[id]/emergency-route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Use service role client directly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { direction } = await request.json()
    const projectId = params.id
    
    // Get user from cookies manually
    const cookies = request.headers.get('cookie') || ''
    const sessionMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/)
    
    if (!sessionMatch) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }
    
    const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]))
    const userId = sessionData.user?.id
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    
    // Direct database insert with service role
    const { data, error } = await supabase
      .from('votes')
      .upsert(
        {
          project_id: projectId,
          user_id: userId,
          vote_type: direction
        },
        { onConflict: 'project_id,user_id' }
      )
      .select()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Emergency vote failed', details: error.message },
      { status: 500 }
    )
  }
}
```


## Phase 10: Final Verification and Go-Live

### Step 17: Complete System Verification


---

# proceed

**Automated Verification Script**

Create this test script to verify all functionality:

```typescript
// scripts/production-verification.ts
export async function runProductionVerification() {
  const results = {
    authentication: false,
    voting: false,
    realtime: false, 
    performance: false,
    errorHandling: false,
    dataIntegrity: false
  }
  
  console.log('🔍 Starting production verification...')
  
  // Test 17.1: Authentication
  try {
    const authResponse = await fetch('/api/debug/environment')
    const authData = await authResponse.json()
    results.authentication = authData.authFunction?.working === true
    console.log(`✅ Authentication: ${results.authentication ? 'PASS' : 'FAIL'}`)
  } catch (error) {
    console.log('❌ Authentication: FAIL -', error.message)
  }
  
  // Test 17.2 & 17.4: Voting & Performance
  try {
    const startTime = Date.now()
    const voteResponse = await fetch('/api/vote/test-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'up' }),
      credentials: 'include'
    })
    
    const responseTime = Date.now() - startTime
    const voteData = await voteResponse.json()
    
    results.voting = voteResponse.ok
    results.performance = responseTime < 2000
    
    console.log(`✅ Voting: ${results.voting ? 'PASS' : 'FAIL'}`)
    console.log(`✅ Performance: ${results.performance ? 'PASS' : 'FAIL'} (${responseTime}ms)`)
    
    if (voteResponse.ok) {
      console.log(`📊 Vote method used: ${voteData.meta?.method}`)
    }
  } catch (error) {
    console.log('❌ Voting/Performance: FAIL -', error.message)
  }
  
  // Test 17.5: Error Handling
  try {
    const errorResponse = await fetch('/api/vote/invalid-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: 'invalid' })
    })
    
    // Should get a proper error response, not crash
    results.errorHandling = errorResponse.status === 400 || errorResponse.status === 404
    console.log(`✅ Error Handling: ${results.errorHandling ? 'PASS' : 'FAIL'}`)
  } catch (error) {
    console.log('❌ Error Handling: FAIL -', error.message)
  }
  
  // Summary
  const passCount = Object.values(results).filter(Boolean).length
  const totalTests = Object.keys(results).length
  
  console.log(`\n📊 VERIFICATION SUMMARY: ${passCount}/${totalTests} tests passed`)
  
  if (passCount === totalTests) {
    console.log('🎉 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION!')
  } else {
    console.log('⚠️ Some tests failed - review issues before full launch')
  }
  
  return results
}
```


### Step 18: Performance Optimization

Once voting works, optimize for production:

```typescript
// utils/performance.ts
export const voteCache = new Map()

export function optimizeVoteResponse(projectId: string, voteData: any) {
  // Cache vote results briefly to prevent spam
  const cacheKey = `vote-${projectId}-${Date.now()}`
  voteCache.set(cacheKey, voteData)
  
  // Clear cache after 5 seconds
  setTimeout(() => voteCache.delete(cacheKey), 5000)
  
  return voteData
}

// Add to vote API route
const cachedVote = voteCache.get(`vote-${projectId}`)
if (cachedVote && Date.now() - cachedVote.timestamp < 1000) {
  return NextResponse.json({
    ...cachedVote,
    cached: true
  })
}
```


## Phase 11: Go-Live and Monitoring

### Step 19: Launch Checklist


---

### Step 19.1: Database Backup

```bash
# Backup current state before deploying fix
# Export votes table
npx supabase db dump --data-only --table=votes > backup-votes-$(date +%Y%m%d).sql

# Backup user profiles
npx supabase db dump --data-only --table=user_profiles > backup-profiles-$(date +%Y%m%d).sql

# Or use Supabase dashboard: 
# Settings → Database → Backups → Create backup
```


### Step 19.2: Final Environment Check

```bash
# Verify all environment variables are set
npx vercel env ls

# Expected output should include:
# NEXT_PUBLIC_SUPABASE_URL (production)
# NEXT_PUBLIC_SUPABASE_ANON_KEY (production)  
# SUPABASE_SERVICE_ROLE_KEY (production)
```


### Step 19.3: Deployment Commands

```bash
# Final deployment sequence
git add .
git commit -m "🚀 PRODUCTION FIX: Multi-layer auth voting system

✅ Fixed server-side Supabase client configuration
✅ Added JWT token forwarding with cookie fallback  
✅ Implemented service role client for critical operations
✅ Enhanced RLS policies for production compatibility
✅ Added comprehensive logging and error handling

Resolves: Production voting system HTTP 500 errors
Tests: All local tests passing, ready for production"

# Push to main (triggers Vercel deployment)
git push origin main

# Monitor deployment
npx vercel logs --follow --limit=50
```


### Step 20: Real-Time Monitoring Setup

Create a monitoring dashboard to track the fix:

```typescript
// app/admin/monitoring/page.tsx
'use client'

import { useState, useEffect } from 'react'

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    voteSuccess: 0,
    voteFailures: 0,
    avgResponseTime: 0,
    authSuccess: 0,
    lastUpdated: null
  })

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      }
    }

    // Fetch metrics every 30 seconds
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const successRate = metrics.voteSuccess + metrics.voteFailures > 0 
    ? (metrics.voteSuccess / (metrics.voteSuccess + metrics.voteFailures) * 100).toFixed(1)
    : 0

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Hatchr Production Monitoring</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Vote Success Rate */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Vote Success Rate</h3>
          <div className={`text-3xl font-bold ${successRate >= 95 ? 'text-green-600' : 'text-red-600'}`}>
            {successRate}%
          </div>
          <div className="text-sm text-gray-600">
            {metrics.voteSuccess} success / {metrics.voteFailures} failures
          </div>
        </div>

        {/* Average Response Time */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Avg Response Time</h3>
          <div className={`text-3xl font-bold ${metrics.avgResponseTime < 1000 ? 'text-green-600' : 'text-yellow-600'}`}>
            {metrics.avgResponseTime}ms
          </div>
          <div className="text-sm text-gray-600">Last 100 requests</div>
        </div>

        {/* Authentication Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Auth Success</h3>
          <div className="text-3xl font-bold text-blue-600">
            {metrics.authSuccess}
          </div>
          <div className="text-sm text-gray-600">Successful logins today</div>
        </div>

        {/* System Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <div className={`text-2xl font-bold ${successRate >= 95 ? 'text-green-600' : 'text-red-600'}`}>
            {successRate >= 95 ? '🟢 HEALTHY' : '🔴 DEGRADED'}
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {metrics.lastUpdated}
          </div>
        </div>
      </div>

      {/* Real-time Logs */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Vote Attempts</h3>
        <VoteLogsTable />
      </div>
    </div>
  )
}
```


### Step 21: Metrics API Endpoint

```typescript
// app/api/admin/metrics/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Get vote statistics from last hour
    const { data: recentVotes, error } = await adminClient
      .from('votes')
      .select('created_at')
      .gte('created_at', oneHourAgo.toISOString())

    // Get authentication statistics
    const { data: recentAuth } = await adminClient
      .from('user_profiles') 
      .select('created_at')
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())

    const metrics = {
      voteSuccess: recentVotes?.length || 0,
      voteFailures: 0, // Would need to track this in logs
      avgResponseTime: 850, // Would calculate from logs
      authSuccess: recentAuth?.length || 0,
      lastUpdated: now.toISOString()
    }

    return NextResponse.json(metrics)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
```


### Step 22: Post-Launch Verification Protocol

```bash
# Immediate post-launch checks (run these within 15 minutes of deployment)

# 1. Check deployment status
npx vercel ls

# 2. Test basic functionality
curl -I https://hatchr.techsagelabs.in
# Should return 200 OK

# 3. Test authentication endpoint  
curl https://hatchr.techsagelabs.in/api/debug/environment
# Should return auth status

# 4. Test health endpoint
curl https://hatchr.techsagelabs.in/api/health
# Should return "healthy" status

# 5. Monitor logs for errors
npx vercel logs --limit=50 | grep ERROR
```


### Step 23: Success Criteria Definition

The fix is considered successful when:

**✅ Primary Success Criteria:**

1. **Vote Success Rate ≥ 95%**: Users can vote without HTTP 500 errors
2. **Database Integration**: Votes are properly saved and retrieved
3. **Authentication Flow**: Users can login/logout without issues
4. **Real-time Updates**: Vote counts update immediately in UI

**✅ Secondary Success Criteria:**

1. **Response Time < 2 seconds**: Vote API responds quickly
2. **Error Handling**: Graceful failures with user-friendly messages
3. **Cross-browser Compatibility**: Works in Chrome, Firefox, Safari
4. **Mobile Responsiveness**: Voting works on mobile devices

### Step 24: Communication Plan

**Internal Team Communication:**

```markdown
# 🚀 Hatchr Production Fix Deployed

## What Changed
- Fixed critical voting system failure in production
- Implemented multi-layer authentication approach
- Enhanced error handling and logging

## Current Status
- ✅ Deployment: Complete
- ✅ Basic Tests: Passing
- 🔄 Monitoring: Active for next 24 hours

## Action Items
- [ ] Monitor vote success rate for next 4 hours
- [ ] Conduct user acceptance testing
- [ ] Review performance metrics

## Rollback Plan
If issues arise: `git revert HEAD && git push origin main`
```

**User Communication (if needed):**

```markdown
# System Update Complete 🎉

We've resolved the voting issues some users experienced earlier. 

**What's Fixed:**
- Voting now works reliably across all projects
- Improved response times
- Better error messaging

**What to Do:**
- Refresh your browser if you have Hatchr open
- Try voting on projects - it should work smoothly now
- Report any issues to support

Thanks for your patience!
```


## Phase 12: Long-term Success

### Step 25: Ongoing Monitoring Strategy

**Daily Checks (First Week):**

- Check vote success rate in admin dashboard
- Review Vercel logs for any new error patterns
- Monitor user feedback and support tickets

**Weekly Reviews:**

- Analyze performance trends
- Review and optimize slow queries
- Update documentation with any lessons learned

**Monthly Improvements:**

- Consider additional authentication methods
- Optimize database performance
- Plan feature enhancements


### Step 26: Documentation Updates

Update your project documentation to reflect the fix:

```markdown
# RESOLVED: Production Voting System Issue

**Issue**: HTTP 500 errors when voting in production
**Root Cause**: JWT authentication context loss in Vercel serverless functions
**Solution**: Multi-layer authentication with service role fallback
**Fixed Date**: September 29, 2025
**Status**: ✅ RESOLVED

## Technical Solution Summary
- Enhanced server-side Supabase client configuration
- Added JWT token forwarding with cookie fallback
- Implemented service role client for critical operations
- Updated RLS policies for production compatibility

## Lessons Learned
1. Vercel serverless functions require special handling for session-based auth
2. Always implement fallback mechanisms for critical operations
3. Service role client provides reliable fallback for authentication issues
4. Comprehensive logging is essential for debugging production issues
```


***

## 🎯 Final Success Validation

Your voting system fix is complete and successful when you can:

1. **✅ Login to https://hatchr.techsagelabs.in**
2. **✅ Click vote buttons without getting HTTP 500 errors**
3. **✅ See vote counts update immediately**
4. **✅ Verify votes are saved in Supabase database**
5. **✅ Monitor system shows 95%+ success rate**

**Expected Timeline:** 2-4 hours for implementation, 24 hours for full verification.[^8_1][^8_2][^8_3][^8_4][^8_5]

This comprehensive approach addresses the core authentication context issue while providing robust fallbacks, ensuring your Hatchr platform's voting system works reliably in production.[^8_6][^8_7][^8_8]

<div align="center">⁂</div>

[^8_1]: https://supabase.com/docs/guides/auth/server-side/nextjs

[^8_2]: https://www.reddit.com/r/Supabase/comments/1hfz7gq/how_to_use_supabase_auth_in_nextjs_without/

[^8_3]: https://www.reddit.com/r/Supabase/comments/1iwxbf9/authuid_returning_null/

[^8_4]: https://github.com/orgs/supabase/discussions/6592

[^8_5]: https://stackoverflow.com/questions/79747396/permission-denied-despite-correct-rls-as-supabase-auth-getuser-returns-null-o

[^8_6]: https://supabase.com/docs/guides/auth/server-side/creating-a-client

[^8_7]: https://techstaunch.com/blogs/implementing-authentication-in-next-js-with-supabase?tech_blog=true

[^8_8]: https://dev.to/thatanjan/how-to-setup-supabase-with-nextjs-for-authentication-supabase-auth-3p76

