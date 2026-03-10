'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión al cargar
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      console.log('📊 Session Data:', data)
      console.log('User:', data.session?.user)
      console.log('Access Token:', data.session?.access_token)
      
      setSession(data.session)
      setLoading(false)
    }

    getSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🎉 ¡Bienvenido al Dashboard!
        </h1>

        {/* Información de Sesión */}
        {session ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ✅ Sesión Activa
            </h2>
            
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-gray-700">User ID:</span>{' '}
                <span className="text-gray-600 font-mono">{session.user.id}</span>
              </p>
              
              <p>
                <span className="font-medium text-gray-700">Email:</span>{' '}
                <span className="text-gray-600">{session.user.email}</span>
              </p>
              
              <p>
                <span className="font-medium text-gray-700">Access Token:</span>{' '}
                <span className="text-gray-600 font-mono text-xs truncate block">
                  {session.access_token.substring(0, 50)}...
                </span>
              </p>

              <p>
                <span className="font-medium text-gray-700">Expires At:</span>{' '}
                <span className="text-gray-600">
                  {new Date(session.expires_at! * 1000).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 p-6 rounded-xl border border-red-200">
            <p className="text-red-600">❌ No hay sesión activa</p>
          </div>
        )}

        {/* Info adicional */}
        <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 Abre la consola del navegador (F12) para ver los logs completos de la sesión
          </p>
        </div>

      </div>
    </div>
  )
}