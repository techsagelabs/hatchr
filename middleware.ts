import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/submit',
  '/profile',
  '/notifications',
  '/connections',
  '/api/projects/(.*)/(vote|comments)',
  '/api/user/(.*)',
  '/api/connections(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Only protect specific routes, let everything else through
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
