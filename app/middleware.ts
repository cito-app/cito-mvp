import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session si existe
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Rutas públicas (no requieren auth)
  const publicRoutes = ['/', '/auth/login', '/auth/registro', '/auth/recuperar-password']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Si está en ruta pública, permitir acceso
  if (isPublicRoute) {
    // Si tiene sesión y está en login o registro, redirigir a dashboard
    if (session && (pathname === '/auth/login' || pathname === '/auth/registro')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return res
  }

  // Para rutas privadas, verificar sesión
  if (!session) {
    // No hay sesión, redirigir a login
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname) // Guardar a dónde quería ir
    return NextResponse.redirect(redirectUrl)
  }

  // Tiene sesión, permitir acceso
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logos (logo files)
     */
    '/((?!_next/static|_next/image|favicon.ico|logos).*)',
  ],
}