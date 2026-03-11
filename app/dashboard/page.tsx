'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        router.push('/auth/login')
        return
      }

      setSession(data.session)

      // Obtener datos del usuario desde la tabla users
      if (data.session?.user) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single()

        if (!userError && user) {
          setUserData(user)
        }
      }

      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      
      if (!session) {
        router.push('/auth/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    const confirmed = confirm('¿Estás seguro que quieres cerrar sesión?')
    
    if (!confirmed) return

    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
              <img 
                src="/logos/cito-logo-h.jpg" 
                alt="Cito.mx" 
                className="h-10"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-gray-900 hover:text-blue-500 transition">
                Dashboard
              </Link>
              <Link href="/dashboard/perfil" className="text-sm font-medium text-gray-600 hover:text-blue-500 transition">
                Perfil
              </Link>
              <Link href="/dashboard/horarios" className="text-sm font-medium text-gray-600 hover:text-blue-500 transition">
                Horarios
              </Link>
              <Link href="/dashboard/citas" className="text-sm font-medium text-gray-600 hover:text-blue-500 transition">
                Citas
              </Link>
            </nav>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {session.user.email?.[0].toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {userData?.nombre_negocio || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userData?.subdominio}.cito.mx
                  </p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{session.user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{userData?.industry}</p>
                  </div>
                  
                  <Link
                    href="/dashboard/perfil"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    ⚙️ Configuración
                  </Link>
                  
                  <Link
                    href={`https://${userData?.subdominio}.cito.mx`}
                    target="_blank"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowUserMenu(false)}
                  >
                    🌐 Ver mi página
                  </Link>
                  
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, {userData?.nombre_negocio || 'Usuario'}! 👋
          </h1>
          <p className="text-gray-600">
            Bienvenido a tu panel de control de Cito.mx
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">HOY</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Citas de hoy</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">TOTAL</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">0</h3>
            <p className="text-sm text-gray-600">Citas completadas</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">PRÓXIMA</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">--</h3>
            <p className="text-sm text-gray-600">Sin citas próximas</p>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Primeros pasos</h2>
          
          <div className="space-y-3">
            <Link
              href="/dashboard/perfil"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition">
                  <span className="text-lg group-hover:grayscale-0 group-hover:invert">⚙️</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Personaliza tu perfil</p>
                  <p className="text-sm text-gray-500">Agrega tu logo y colores de marca</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/dashboard/horarios"
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition">
                  <span className="text-lg">🕐</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Configura tus horarios</p>
                  <p className="text-sm text-gray-500">Define tu disponibilidad semanal</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🌐</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tu página pública</p>
                  <p className="text-sm text-gray-500">{userData?.subdominio}.cito.mx</p>
                </div>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">Próximamente</span>
            </div>
          </div>
        </div>

        {/* Info de Sesión (Dev) */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-blue-900 mb-2">
              🔧 Información de desarrollo
            </summary>
            <div className="mt-3 space-y-2 text-xs text-blue-800">
              <p><span className="font-medium">User ID:</span> {session.user.id}</p>
              <p><span className="font-medium">Email:</span> {session.user.email}</p>
              <p><span className="font-medium">Subdominio:</span> {userData?.subdominio}</p>
              <p><span className="font-medium">Industry:</span> {userData?.industry}</p>
              <p><span className="font-medium">Sesión expira:</span> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            </div>
          </details>
        </div>

      </main>
    </div>
  )
}