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
  
  // Estados de edición
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        setNombreNegocio(user.nombre_negocio || '')
        setEmail(data.session.user.email || '')
      }

      setLoading(false)
    }

    getSession()
  }, [router])

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
    setSuccess('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setNombreNegocio(userData.nombre_negocio || '')
    setEmail(session.user.email || '')
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')

    // Validaciones
    if (!nombreNegocio || nombreNegocio.trim().length < 3) {
      setError('El nombre del negocio debe tener al menos 3 caracteres')
      return
    }

    if (!email || !email.includes('@')) {
      setError('Email inválido')
      return
    }

    setSaving(true)

    try {
      // Actualizar nombre del negocio en tabla users
      const { error: updateError } = await supabase
        .from('users')
        .update({ nombre_negocio: nombreNegocio.trim() })
        .eq('id', session.user.id)

      if (updateError) {
        console.error('Error updating user:', updateError)
        setError('Error al guardar. Intenta de nuevo.')
        setSaving(false)
        return
      }

      // Si el email cambió, actualizar en Auth
      if (email !== session.user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        })

        if (emailError) {
          console.error('Error updating email:', emailError)
          setError('Error al actualizar el email. Intenta de nuevo.')
          setSaving(false)
          return
        }
      }

      // Actualizar estado local
      setUserData({ ...userData, nombre_negocio: nombreNegocio.trim() })
      setSuccess('✅ Cambios guardados exitosamente')
      setIsEditing(false)
      setSaving(false)

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError('Error inesperado. Intenta de nuevo.')
      setSaving(false)
    }
  }

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

  // Mapeo de industries
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
      {/* Navbar */}
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
        
        {/* Header con botón editar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mi Perfil
            </h1>
            <p className="text-gray-600">
              Información de tu negocio y cuenta
            </p>
          </div>
          
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar Perfil
            </button>
          )}
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

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
              {isEditing ? (
                <input
                  type="text"
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="Ej: Dental Ayala"
                />
              ) : (
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900 font-medium">
                    {userData.nombre_negocio || 'Sin nombre'}
                  </p>
                </div>
              )}
            </div>

            {/* Tipo de Negocio (No editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Negocio
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900">
                  {industryNames[userData.industry] || userData.industry}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 El tipo de negocio no se puede cambiar después del registro
              </p>
            </div>

            {/* Subdominio (No editable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Página Pública
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-mono">
                  {userData.subdominio}.cito.mx
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 El subdominio no se puede cambiar después del registro
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
              {isEditing ? (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="tu@ejemplo.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ Si cambias tu email, necesitarás confirmarlo
                  </p>
                </>
              ) : (
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900">
                    {session.user.email}
                  </p>
                </div>
              )}
            </div>

            {/* Contraseña (Link a cambiar) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900">
                  ••••••••
                </p>
                {!isEditing && (
                  <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                    Cambiar contraseña
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Botones de acción */}
        {isEditing && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </button>
            
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg border border-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Personalización (sin editar aún) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              🎨 Personalización
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            
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
                <div>
                  <p className="text-sm text-gray-500">Sin logo cargado</p>
                  <p className="text-xs text-gray-400 mt-1">Próximamente: Subir logo</p>
                </div>
              </div>
            </div>

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
                  <p className="text-xs text-gray-400">Próximamente: Cambiar color</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}