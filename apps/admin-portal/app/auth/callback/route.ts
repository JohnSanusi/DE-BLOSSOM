import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) return NextResponse.redirect(new URL('/?error=oauth', requestUrl.origin))

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin))

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('role, username').eq('id', user.id).maybeSingle()
    : { data: null }

  const destination = profile?.role === 'admin'
    ? '/admin'
    : profile?.username
      ? '/member'
      : '/onboarding'

  return NextResponse.redirect(new URL(destination, requestUrl.origin))
}