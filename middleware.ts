import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      } satisfies CookieMethodsServer,
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Redirect unauthenticated users away from protected routes.
  if (!user && (pathname.startsWith('/editor') || pathname.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect authenticated users away from auth pages.
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/editor', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/editor', '/editor/:path*', '/admin', '/admin/:path*', '/login', '/register'],
};
