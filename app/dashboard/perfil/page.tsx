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
  const [colorPrimario, setColorPrimario] = useState('#3B82F6')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados de cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Estados de logo
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState('')

  // Paleta de colores predefinidos
  const colorPresets = [
    { name: 'Azul', color: '#3B82F6' },
    { name: 'Púrpura', color: '#8B5CF6' },
    { name: 'Verde', color: '#10B981' },
    { name: 'Rojo', color: '#EF4444' },
    { name: 'Naranja', color: '#F59E0B' },
    { name: 'Rosa', color: '#EC4899' },
    { name: 'Cyan', color: '#06B6D4' },
    { name: 'Índigo', color: '#6366F1' },
  ]

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error || !data.session) {
        router.push('/auth/login')
        return
      }

      setSession(data.session)

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (!userError && user) {
        setUserData(user)
        setNombreNegocio(user.nombre_negocio || '')
        setEmail(data.session.user.email || '')
        setColorPrimario(user.color_primario || '#3B82F6')
        if (user.logo_url) {
          setLogoPreview(user.logo_url)
        }
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
    setColorPrimario(userData.color_primario || '#3B82F6')
    setError('')
    setSuccess('')
    setLogoFile(null)
    setLogoPreview(userData.logo_url || null)
    setLogoError('')
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file) return

    setLogoError('')

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setLogoError('Solo se permiten imágenes PNG, JPG o WEBP')
      return
    }

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setLogoError('El logo debe pesar menos de 2MB')
      return
    }

    setLogoFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(userData.logo_url || null)
    setLogoError('')
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return userData.logo_url || null

    setUploadingLogo(true)

    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      if (userData.logo_url) {
        const oldFileName = userData.logo_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('logos')
            .remove([oldFileName])
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Error al subir el logo')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      setUploadingLogo(false)
      return publicUrl

    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadingLogo(false)
      throw error
    }
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setLogoError('')

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
      let logoUrl = userData.logo_url
      if (logoFile) {
        const uploadedUrl = await uploadLogo()
        if (uploadedUrl) {
          logoUrl = uploadedUrl
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          nombre_negocio: nombreNegocio.trim(),
          logo_url: logoUrl,
          color_primario: colorPrimario
        })
        .eq('id', session.user.id)

      if (updateError) {
        console.error('Error updating user:', updateError)
        setError('Error al guardar. Intenta de nuevo.')
        setSaving(false)
        return
      }

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

      setUserData({ 
        ...userData, 
        nombre_negocio: nombreNegocio.trim(),
        logo_url: logoUrl,
        color_primario: colorPrimario
      })
      setLogoFile(null)
      setSuccess('✅ Cambios guardados exitosamente')
      setIsEditing(false)
      setSaving(false)

      setTimeout(() => setSuccess(''), 3000)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError(error.message || 'Error inesperado. Intenta de nuevo.')
      setSaving(false)
    }
  }

  const validatePassword = (password: string) => {
    if (!password) return 'La contraseña es requerida'
    if (password.length < 8) return 'Mínimo 8 caracteres'
    if (!/\d/.test(password)) return 'Debe incluir al menos un número'
    if (!/[a-zA-Z]/.test(password)) return 'Debe incluir al menos una letra'
    return ''
  }

  const handleOpenPasswordModal = () => {
    setShowPasswordModal(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handleClosePasswordModal = () => {
    if (savingPassword) return
    setShowPasswordModal(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword) {
      setPasswordError('Ingresa tu contraseña actual')
      return
    }

    const newPasswordError = validatePassword(newPassword)
    if (newPasswordError) {
      setPasswordError(newPasswordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setSavingPassword(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword
      })

      if (signInError) {
        setPasswordError('La contraseña actual es incorrecta')
        setSavingPassword(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        console.error('Error updating password:', updateError)
        setPasswordError('Error al cambiar la contraseña. Intenta de nuevo.')
        setSavingPassword(false)
        return
      }

      setPasswordSuccess('✅ Contraseña actualizada exitosamente')
      setSavingPassword(false)

      setTimeout(() => {
        handleClosePasswordModal()
      }, 2000)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setPasswordError('Error inesperado. Intenta de nuevo.')
      setSavingPassword(false)
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
        
        {/* Header */}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                <p className="text-gray-900">
                  ••••••••
                </p>
                {!isEditing && (
                  <button 
                    onClick={handleOpenPasswordModal}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Cambiar contraseña
                  </button>
                )}
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
            
            {/* Logo del Negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo del Negocio
              </label>
              
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleLogoChange}
                        disabled={saving || uploadingLogo}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      
                      {logoFile && (
                        <button
                          onClick={handleRemoveLogo}
                          disabled={saving || uploadingLogo}
                          className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                          ✕ Remover imagen seleccionada
                        </button>
                      )}

                      {logoError && (
                        <p className="text-sm text-red-500">{logoError}</p>
                      )}

                      <p className="text-xs text-gray-500">
                        📁 Formatos: PNG, JPG, WEBP • Máximo 2MB • Recomendado: 512x512px
                      </p>
                    </div>
                  ) : (
                    <div>
                      {userData.logo_url ? (
                        <p className="text-sm text-gray-600">Logo cargado</p>
                      ) : (
                        <p className="text-sm text-gray-500">Sin logo cargado</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Color de Marca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color de Marca
              </label>
              
              {isEditing ? (
                <div className="space-y-4">
                  {/* Color Picker Nativo */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={colorPrimario}
                      onChange={(e) => setColorPrimario(e.target.value)}
                      disabled={saving}
                      className="w-20 h-20 rounded-lg border-2 border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={colorPrimario}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^#[0-9A-F]{0,6}$/i.test(value) || value === '') {
                            setColorPrimario(value)
                          }
                        }}
                        disabled={saving}
                        placeholder="#3B82F6"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Código hexadecimal (ej: #3B82F6)
                      </p>
                    </div>
                  </div>

                  {/* Paleta de Colores Predefinidos */}
                  <div>
                    <p className="text-sm text-gray-600 mb-3">Colores sugeridos:</p>
                    <div className="grid grid-cols-4 gap-3">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() => setColorPrimario(preset.color)}
                          disabled={saving}
                          className={`relative group`}
                        >
                          <div
                            className={`w-full aspect-square rounded-lg border-2 transition ${
                              colorPrimario === preset.color
                                ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                                : 'border-gray-200 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: preset.color }}
                          >
                            {colorPrimario === preset.color && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 text-center">{preset.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview del Color */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                    <div className="space-y-3">
                      <button
                        type="button"
                        className="px-6 py-3 text-white font-semibold rounded-lg shadow-sm"
                        style={{ backgroundColor: colorPrimario }}
                      >
                        Botón de Ejemplo
                      </button>
                      <div
                        className="w-full h-2 rounded-full"
                        style={{ backgroundColor: colorPrimario }}
                      ></div>
                      <p className="text-xs text-gray-500">
                        Este color se usará en tu página pública para botones, enlaces y acentos
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
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
              )}
            </div>

          </div>
        </div>

        {/* Botones de acción */}
        {isEditing && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploadingLogo}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2"
            >
              {saving || uploadingLogo ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {uploadingLogo ? 'Subiendo logo...' : 'Guardando...'}
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
              disabled={saving || uploadingLogo}
              className="px-6 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg border border-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        )}

      </main>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                🔐 Cambiar Contraseña
              </h3>
            </div>

            <div className="p-6 space-y-4">
              
              {passwordError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{passwordSuccess}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={savingPassword}
                  placeholder="Tu contraseña actual"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={savingPassword}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres, incluye números y letras
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={savingPassword}
                  placeholder="Repite tu nueva contraseña"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {savingPassword ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Actualizando...
                  </>
                ) : (
                  'Cambiar Contraseña'
                )}
              </button>
              
              <button
                onClick={handleClosePasswordModal}
                disabled={savingPassword}
                className="px-4 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg border border-gray-200 transition"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}