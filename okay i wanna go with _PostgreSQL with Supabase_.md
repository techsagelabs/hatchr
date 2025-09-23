<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# okay i wanna go with "PostgreSQL with Supabase"

Perfect choice! **PostgreSQL with Supabase** will give you a robust, scalable foundation for your social media app. Let me guide you through the complete setup process with your existing Next.js 15 + Clerk stack.

## Initial Supabase Setup

### Create Your Supabase Project

1. Go to [database.new](https://database.new) and create a new Supabase project[^1]
2. Choose a project name, secure password, and your closest region[^2]
3. Save your database password in a secure location[^3]

### Install Required Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```


### Environment Variables

Add these to your `.env.local` file :[^1]

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```


## Updated Clerk + Supabase Integration (2025)

**Important**: The old JWT template method is deprecated as of April 1, 2025. Here's the new integration approach :[^4][^3]

### Configure Clerk for Supabase

1. In your Clerk dashboard, go to **API Keys** and enable Supabase compatibility[^3]
2. Note down your **Issuer URL** and **JWKS endpoint**[^3]

### Add Clerk as Third-Party Provider in Supabase

1. In Supabase, navigate to **Authentication > Providers > External OAuth**[^3]
2. Select **Clerk** and input the **Issuer URL** and **JWKS endpoint** from Clerk[^5]

### Create Supabase Client with Clerk Integration

Create `utils/supabase/server.ts` :[^1]

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs'

export async function createClient() {
  const cookieStore = await cookies()
  const { getToken } = auth()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component limitation - can be ignored with middleware
          }
        },
      },
      global: {
        headers: async () => {
          const token = await getToken({ template: 'supabase' })
          return token ? { Authorization: `Bearer ${token}` } : {}
        }
      }
    }
  )
}
```


## Social Media Database Schema

Here's an optimized schema for your social media app :[^6]

### Core Tables

```sql
-- Users table (synced with Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]', -- Array of media URLs
  media_types JSONB DEFAULT '[]', -- Array of media types (image/video)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table (upvotes/downvotes)
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 downvote, 1 upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id) -- One vote per user per post
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threaded comments
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections/Following table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id) -- Can't follow yourself
);
```


### Optimized Indexes

```sql
-- Performance indexes
CREATE INDEX idx_posts_user_id_created_at ON posts(user_id, created_at DESC);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_comments_post_id_created_at ON comments(post_id, created_at);
CREATE INDEX idx_connections_follower_id ON connections(follower_id);
CREATE INDEX idx_connections_following_id ON connections(following_id);
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
```


### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = clerk_user_id);

-- Posts are readable by everyone, but users can only manage their own
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid()::text = (SELECT clerk_user_id FROM users WHERE id = user_id));

-- Similar policies for votes, comments, and connections
```


## Advanced Features Setup

### Real-time Subscriptions

Enable real-time updates for your social media features :[^7]

```typescript
// Subscribe to new posts
const supabase = createClient()
const subscription = supabase
  .channel('posts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'posts'
  }, (payload) => {
    // Handle new post
  })
  .subscribe()
```


### Media Storage Integration

Set up Cloudflare R2 for media storage:

```sql
-- Media metadata table
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(20) NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```


## Next Steps

### Immediate Implementation

1. **Set up the database schema** using Supabase SQL Editor[^1]
2. **Configure RLS policies** for security[^3]
3. **Test Clerk integration** with a simple user profile page[^5]
4. **Implement basic CRUD operations** for posts and users[^6]

### Development Workflow

1. **Use Supabase's Table Editor** for quick data management[^8]
2. **Set up database migrations** for schema changes[^1]
3. **Test real-time features** with Supabase's built-in tools[^7]
4. **Monitor performance** using Supabase analytics[^8]

### Recommended Project Structure

```
/app
  /api
    /posts
    /users
    /votes
/components
  /ui (shadcn components)
  /posts
  /profile
/lib
  /supabase
  /utils
/utils
  /supabase
```

This setup gives you a production-ready foundation that can scale with your user base while maintaining excellent performance and security. The combination of Clerk's authentication with Supabase's real-time capabilities and PostgreSQL's robustness is perfect for social media applications.[^5][^7][^1][^3]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^9]</span>

```
<div style="text-align: center">⁂</div>
```

[^1]: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

[^2]: https://www.zestminds.com/blog/supabase-auth-nextjs-setup-guide/

[^3]: https://supertokens.com/blog/how-to-integrate-clerk-with-supabase

[^4]: https://supabase.com/docs/guides/auth/third-party/clerk

[^5]: https://clerk.com/docs/integrations/databases/supabase

[^6]: https://www.codu.co/articles/building-a-social-media-platform-with-postgresql-a-final-project-qo_rb0zh

[^7]: https://docs.lovable.dev/integrations/supabase

[^8]: https://supabase.com/docs/guides/database/overview

[^9]: https://www.youtube.com/watch?v=q1vAOlupxQ4

[^10]: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs

[^11]: https://www.youtube.com/watch?v=kyphLGnSz6Q

[^12]: https://supabase.com/docs/guides/auth/server-side/nextjs

[^13]: https://engineering.teknasyon.com/next-js-with-supabase-google-login-step-by-step-guide-088ef06e0501

[^14]: https://supabase.com/partners/clerk

[^15]: https://www.youtube.com/watch?v=_sSTzz13tVY

[^16]: https://www.youtube.com/watch?v=xDWoZPNASA4

[^17]: https://www.youtube.com/watch?v=ugxI1o5SyMs

[^18]: https://clerk.com/blog/how-clerk-integrates-with-supabase-auth

[^19]: https://www.reddit.com/r/reactnative/comments/1hidj2b/social_media_app_using_only_postgresql_queries/

[^20]: https://www.youtube.com/watch?v=hcw38fUPNbw

