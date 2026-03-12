'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setError('')
    
    if (!email) {
      setError('Por favor ingresa tu email')
      return
    }

    setLoading(true)

    try {
      // NOTA: Este código funcionará en producción
      // Por ahora solo validamos la UI
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        console.error('Reset error:', resetError)
        setError('Error al enviar el email. Intenta de nuevo.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setError('Error inesperado. Intenta de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center hover:opacity-80 transition">
            <img 
              src="/logos/cito-logo-h.jpg" 
              alt="Cito.mx" 
              className="h-10"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          
          {success ? (
            // Mensaje de éxito
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email enviado ✅
              </h1>
              
              <p className="text-gray-600 mb-6">
                Revisa tu correo <span className="font-medium text-gray-900">{email}</span>
              </p>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <p className="text-sm text-blue-800 mb-2">
                  📧 Te enviamos un link para restablecer tu contraseña. El link expira en 1 hora.
                </p>
                <p className="text-xs text-blue-600">
                  💡 En producción con SMTP propio, el email llegará instantáneamente.
                </p>
              </div>

              <Link
                href="/auth/login"
                className="inline-block text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                ← Volver al login
              </Link>
            </div>
          ) : (
            // Formulario
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="text-gray-600">
                  Ingresa tu email y te enviaremos un link para recuperarla
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder="tu@ejemplo.com"
                      autoComplete="email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Enviando...
                      </>
                    ) : (
                      'Enviar link de recuperación'
                    )}
                  </button>

                  <p className="text-center text-sm text-gray-600">
                    ¿Recordaste tu contraseña?{' '}
                    <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
                      Inicia sesión
                    </Link>
                  </p>

                </form>
              </div>

              {/* Nota de desarrollo */}
              <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  ⚠️ <span className="font-medium">Modo desarrollo:</span> El envío de emails está configurado pero no se prueba para evitar rate limits. En producción funcionará con SMTP propio.
                </p>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  )
}