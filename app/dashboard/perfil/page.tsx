'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function PerfilPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error || !data.session) {
        router.push('/auth/login')
        return
      }

      setSession(data.session)

      // Obtener datos del usuario
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (!userError && user) {
        setUserData(user)
      }

      setLoading(false)
    }

    getSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!session || !userData) {
    return null
  }

  // Mapeo de industries a nombres legibles
  const industryNames: { [key: string]: string } = {
    'dentista': '🦷 Dentista / Odontología',
    'spa': '💆 Spa / Estética',
    'veterinaria': '🐕 Veterinaria',
    'gym': '💪 Gimnasio / Fitness',
    'medico': '⚕️ Consultorio Médico',
    'salon': '💇 Salón de Belleza',
    'psicologo': '🧠 Psicología / Terapia',
    'otro': '📋 Otro'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Simple */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mi Perfil
          </h1>
          <p className="text-gray-600">
            Información de tu negocio y cuenta
          </p>
        </div>

        {/* Información del Negocio */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              🏢 Información del Negocio
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            
            {/* Nombre del Negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Negocio
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-medium">
                  {userData.nombre_negocio || 'Sin nombre'}
                </p>
              </div>
            </div>

            {/* Tipo de Negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Negocio
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900">
                  {industryNames[userData.industry] || userData.industry}
                </p>
              </div>
            </div>

            {/* Subdominio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Página Pública
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-mono">
                  {userData.subdominio}.cito.mx
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Este será el enlace que compartirás con tus clientes
              </p>
            </div>

          </div>
        </div>

        {/* Información de la Cuenta */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              👤 Información de la Cuenta
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900">
                  {session.user.email}
                </p>
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900">
                  ••••••••
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Personalización */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              🎨 Personalización
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo del Negocio
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                  {userData.logo_url ? (
                    <img 
                      src={userData.logo_url} 
                      alt="Logo" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                {!userData.logo_url && (
                  <p className="text-sm text-gray-500">
                    Sin logo cargado
                  </p>
                )}
              </div>
            </div>

            {/* Color Primario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de Marca
              </label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: userData.color_primario || '#3B82F6' }}
                ></div>
                <div>
                  <p className="text-gray-900 font-mono text-sm">
                    {userData.color_primario || '#3B82F6'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Color que se usará en tu página pública
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Metadata */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-blue-900 mb-2">
              🔧 Información técnica
            </summary>
            <div className="mt-3 space-y-2 text-xs text-blue-800">
              <p><span className="font-medium">User ID:</span> {userData.id}</p>
              <p><span className="font-medium">Creado:</span> {new Date(userData.created_at).toLocaleDateString('es-MX')}</p>
              <p><span className="font-medium">Email verificado:</span> {session.user.email_confirmed_at ? 'Sí' : 'No'}</p>
            </div>
          </details>
        </div>

        {/* Placeholder para botón editar (próxima semana) */}
        <div className="mt-8 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            📝 <span className="font-medium">Próximamente:</span> Podrás editar toda esta información desde esta misma página.
          </p>
        </div>

      </main>
    </div>
  )
}