'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
    general: ''
  })
  const [success, setSuccess] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    
    if (accessToken) {
      setHasToken(true)
    } else {
      setHasToken(true)
    }
  }, [])

  const validatePassword = (password: string) => {
    if (!password) return 'La contraseña es requerida'
    if (password.length < 8) return 'Mínimo 8 caracteres'
    if (!/\d/.test(password)) return 'Debe incluir al menos un número'
    if (!/[a-zA-Z]/.test(password)) return 'Debe incluir al menos una letra'
    return ''
  }

  const validateConfirmPassword = (confirm: string, original: string) => {
    if (!confirm) return 'Confirma tu contraseña'
    if (confirm !== original) return 'Las contraseñas no coinciden'
    return ''
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    const error = validatePassword(value)
    setErrors(prev => ({ ...prev, password: error }))
    
    // Re-validar confirmación si ya tiene algo
    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, value)
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    const error = validateConfirmPassword(value, password)
    setErrors(prev => ({ ...prev, confirmPassword: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setErrors(prev => ({ ...prev, general: '' }))

    // Validar todo
    const passwordError = validatePassword(password)
    const confirmError = validateConfirmPassword(confirmPassword, password)

    if (passwordError || confirmError) {
      setErrors({
        password: passwordError,
        confirmPassword: confirmError,
        general: ''
      })
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('Update error:', updateError)
        setErrors(prev => ({ ...prev, general: 'Error al actualizar la contraseña. Verifica que el link sea válido.' }))
        setLoading(false)
        return
      }

      setSuccess(true)
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setErrors(prev => ({ ...prev, general: 'Error inesperado. Intenta de nuevo.' }))
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Contraseña actualizada! ✅
          </h1>
          
          <p className="text-gray-600 mb-6">
            Tu contraseña ha sido restablecida exitosamente
          </p>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Redirigiendo al login en 3 segundos...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center hover:opacity-80 transition">
            <img 
              src="/logos/cito-logo-h.png" 
              alt="Cito.mx" 
              className="h-10"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Nueva contraseña
            </h1>
            <p className="text-gray-600">
              Ingresa tu nueva contraseña
            </p>
          </div>

          {/* Error General */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Nueva Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={loading}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.password ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.password ? (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                ) : password && !errors.password ? (
                  <p className="text-sm text-green-600 mt-1">✓ Contraseña válida</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 8 caracteres, incluye números y letras
                  </p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  disabled={loading}
                  placeholder="Repite tu contraseña"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.confirmPassword ? (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                ) : confirmPassword && !errors.confirmPassword ? (
                  <p className="text-sm text-green-600 mt-1">✓ Las contraseñas coinciden</p>
                ) : null}
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading || !!errors.password || !!errors.confirmPassword || !password || !confirmPassword}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Actualizando...
                  </>
                ) : (
                  'Actualizar contraseña'
                )}
              </button>

            </form>
          </div>

          {/* Nota de desarrollo */}
          <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⚠️ <span className="font-medium">Modo desarrollo:</span> Esta página necesita un token de recuperación válido. En producción llegará vía email.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}