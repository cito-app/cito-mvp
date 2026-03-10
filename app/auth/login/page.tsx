'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setError('')
    
    // Validaciones básicas
    if (!email || !password) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)

    try {
      // PASO 1: Intentar login con Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (authError) {
        console.error('Auth error:', authError)
        
        // Manejar errores específicos
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email primero')
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Error al iniciar sesión')
        setLoading(false)
        return
      }

      // PASO 2: Login exitoso
      console.log('✅ Login exitoso!')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      
      // PASO 3: Redirect al dashboard
      router.push('/dashboard')

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
          
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Inicia sesión
            </h1>
            <p className="text-gray-600">
              Accede a tu cuenta de Cito.mx
            </p>
          </div>

          {/* Error General */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email */}
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

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Contraseña
                  </label>
                  <Link 
                    href="/auth/recuperar-password" 
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                  Mantener sesión iniciada
                </label>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>

              {/* Link a Registro */}
              <p className="text-center text-sm text-gray-600">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/registro" className="text-blue-500 hover:text-blue-600 font-medium">
                  Regístrate gratis
                </Link>
              </p>

            </form>
          </div>

          {/* Footer info */}
          <p className="text-center text-xs text-gray-500 mt-6">
            7 días gratis • Sin tarjeta de crédito
          </p>

        </div>
      </main>
    </div>
  )
}