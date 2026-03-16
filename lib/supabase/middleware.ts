import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes logic
  const url = request.nextUrl.clone()
  
  if (!user && (url.pathname.startsWith('/creator') || url.pathname.startsWith('/admin'))) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect if logged in but trying to access login page
  if (user && url.pathname === '/login') {
    // We would need to know the role to redirect correctly, 
    // but for now let's just go to a generic dashboard or let it be.
    // Roles will be handled in a layout or specific page checks.
  }

  return supabaseResponse
}
