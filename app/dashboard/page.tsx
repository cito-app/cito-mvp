'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión inicial
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        router.push('/auth/login')
        return
      }

      console.log('📊 Session Data:', data)
      setSession(data.session)
      setLoading(false)
    }

    getSession()

    // Escuchar cambios de auth (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔄 Auth state changed:', _event)
      setSession(session)
      
      if (!session) {
        router.push('/auth/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando sesión...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con Logout */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logos/cito-logo-h.jpg" 
              alt="Cito.mx" 
              className="h-10"
            />
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🎉 ¡Bienvenido al Dashboard!
        </h1>

        {/* Información de Sesión */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-green-600 mb-4">
            ✅ Sesión Persistente Activa
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-medium text-gray-700">User ID:</span>{' '}
              <span className="text-gray-900 font-mono text-xs">{session.user.id}</span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-medium text-gray-700">Email:</span>{' '}
              <span className="text-gray-900">{session.user.email}</span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded">
              <span className="font-medium text-gray-700">Expires At:</span>{' '}
              <span className="text-gray-900">
                {new Date(session.expires_at! * 1000).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Test de Persistencia */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">
            🧪 Prueba la persistencia:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Recarga la página (F5) - La sesión se mantiene</li>
            <li>✅ Cierra y abre el navegador - La sesión se mantiene</li>
            <li>✅ Intenta ir a /auth/login - Te redirige aquí</li>
            <li>✅ Click "Cerrar sesión" - Te redirige a login</li>
          </ul>
        </div>

      </div>
    </div>
  )
}