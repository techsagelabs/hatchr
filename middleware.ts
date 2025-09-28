import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object to hold the response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Define routes that require authentication
  const protectedRoutes = [
    '/submit',
    '/profile',
    '/notifications',
    '/connections',
  ]

  const protectedApiRoutes = [
    '/api/projects/.*/vote',
    '/api/projects/.*/comments',
    '/api/user/',
    '/api/connections'
  ]

  const { pathname } = request.nextUrl
  
  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isProtectedApiRoute = protectedApiRoutes.some(route => {
    const regex = new RegExp(route.replace(/\*/g, '[^/]+'))
    return regex.test(pathname)
  })

  if (isProtectedRoute || isProtectedApiRoute) {
    // Get user session
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      // Redirect to sign-in for protected pages
      if (isProtectedRoute) {
        const redirectUrl = new URL('/sign-in', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Return 401 for protected API routes
      if (isProtectedApiRoute) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }
  }

  return response
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