'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegistroPage() {
  const router = useRouter()
  
  // Estados para cada campo
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [industry, setIndustry] = useState('')
  const [subdominio, setSubdominio] = useState('')
  const [subdominioManual, setSubdominioManual] = useState(false)
  const [terminos, setTerminos] = useState(false)

  // Estados de UI
  const [loading, setLoading] = useState(false)
  const [subdominioChecking, setSubdominioChecking] = useState(false)
  const [subdominioDisponible, setSubdominioDisponible] = useState<boolean | null>(null)

  // Estados para errores
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    nombreNegocio: '',
    industry: '',
    subdominio: '',
    terminos: '',
    general: ''
  })

  // Función para generar subdominio desde nombre
  const generarSubdominio = (nombre: string): string => {
    let resultado = nombre.toLowerCase()
    
    const acentos: { [key: string]: string } = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
      'ü': 'u', 'ñ': 'n',
      'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
      'Ü': 'u', 'Ñ': 'n'
    }
    
    for (const [acento, reemplazo] of Object.entries(acentos)) {
      resultado = resultado.replace(new RegExp(acento, 'g'), reemplazo)
    }
    
    resultado = resultado.replace(/[^a-z0-9]/g, '')
    
    return resultado
  }

  // Auto-generar subdominio
  useEffect(() => {
    if (!subdominioManual && nombreNegocio) {
      const nuevoSubdominio = generarSubdominio(nombreNegocio)
      setSubdominio(nuevoSubdominio)
    }
  }, [nombreNegocio, subdominioManual])

  // Verificar disponibilidad de subdominio
  useEffect(() => {
    const verificarDisponibilidad = async () => {
      if (!subdominio || subdominio.length < 3) {
        setSubdominioDisponible(null)
        return
      }

      setSubdominioChecking(true)

      try {
        const { data, error } = await supabase
          .from('users')
          .select('subdominio')
          .eq('subdominio', subdominio)
          .maybeSingle()

        if (error) {
          console.error('Error checking subdomain:', error)
          setSubdominioDisponible(null)
        } else {
          setSubdominioDisponible(data === null)
        }
      } catch (err) {
        console.error('Error:', err)
        setSubdominioDisponible(null)
      } finally {
        setSubdominioChecking(false)
      }
    }

    const timer = setTimeout(verificarDisponibilidad, 500)
    return () => clearTimeout(timer)
  }, [subdominio])

  // Funciones de validación
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'El email es requerido'
    if (!emailRegex.test(email)) return 'Email inválido'
    return ''
  }

  const validatePassword = (password: string) => {
    if (!password) return 'La contraseña es requerida'
    if (password.length < 8) return 'Mínimo 8 caracteres'
    if (!/\d/.test(password)) return 'Debe incluir al menos un número'
    if (!/[a-zA-Z]/.test(password)) return 'Debe incluir al menos una letra'
    return ''
  }

  const validateNombreNegocio = (nombre: string) => {
    if (!nombre) return 'El nombre del negocio es requerido'
    if (nombre.length < 3) return 'Mínimo 3 caracteres'
    return ''
  }

  const validateIndustry = (industry: string) => {
    if (!industry) return 'Selecciona el tipo de negocio'
    return ''
  }

  const validateSubdominio = (subdominio: string) => {
    if (!subdominio) return 'El subdominio es requerido'
    if (!/^[a-z0-9]+$/.test(subdominio)) return 'Solo letras minúsculas y números'
    if (subdominio.length < 3) return 'Mínimo 3 caracteres'
    if (subdominioDisponible === false) return 'Este subdominio ya está en uso'
    return ''
  }

  // Manejar submit - INTEGRACIÓN CON SUPABASE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Limpiar error general
    setErrors(prev => ({ ...prev, general: '' }))

    // Validar todos los campos
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const nombreError = validateNombreNegocio(nombreNegocio)
    const industryError = validateIndustry(industry)
    const subdominioError = validateSubdominio(subdominio)
    const terminosError = !terminos ? 'Debes aceptar los términos y condiciones' : ''

    // Actualizar errores
    setErrors({
      email: emailError,
      password: passwordError,
      nombreNegocio: nombreError,
      industry: industryError,
      subdominio: subdominioError,
      terminos: terminosError,
      general: ''
    })

    // Si hay errores, no continuar
    if (emailError || passwordError || nombreError || industryError || subdominioError || terminosError) {
      return
    }

    // Verificar disponibilidad una última vez
    if (subdominioDisponible !== true) {
      setErrors(prev => ({ ...prev, subdominio: 'Verifica la disponibilidad del subdominio' }))
      return
    }

    setLoading(true)

    try {
      // PASO 1: Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            nombre_negocio: nombreNegocio,
            subdominio: subdominio,
            industry: industry
          }
        }
      })

      if (authError) {
        console.error('Auth error:', authError)
        
        // Manejar errores específicos
        if (authError.message.includes('already registered')) {
          setErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }))
        } else {
          setErrors(prev => ({ ...prev, general: authError.message }))
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setErrors(prev => ({ ...prev, general: 'Error al crear la cuenta' }))
        setLoading(false)
        return
      }

      // PASO 2: Insertar en tabla users
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Usar el ID de Auth
          email: email,
          nombre_negocio: nombreNegocio,
          subdominio: subdominio,
          industry: industry,
          color_primario: '#3B82F6' // Color por defecto
        })

    if (dbError) {
        console.error('Database error:', dbError)
  
    if (dbError.message.includes('duplicate')) {
        setErrors(prev => ({ ...prev, general: 'Este email o subdominio ya existe' }))
    } else {
        setErrors(prev => ({ ...prev, general: `Error al crear el negocio: ${dbError.message}` }))
    }
    setLoading(false)
    return
    }

      // PASO 3: Éxito - Redirect a página de bienvenida
      console.log('✅ Usuario creado exitosamente!')
      console.log('User ID:', authData.user.id)
      console.log('Email:', email)
      console.log('Subdominio:', `${subdominio}.cito.mx`)
      
      // Redirect a página de bienvenida
      router.push('/auth/bienvenida')

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setErrors(prev => ({ ...prev, general: 'Error inesperado. Intenta de nuevo.' }))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
<header className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 py-4">
    <a href="/" className="inline-flex items-center hover:opacity-80 transition">
      <img 
        src="/logos/cito-logo-h.jpg" 
        alt="Cito.mx" 
        className="h-10"
      />
    </a>
  </div>
</header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          
          {/* Título */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Crea tu cuenta
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Comienza tu prueba gratis de 7 días
            </p>
          </div>

          {/* Error General */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }))
                  }}
                  disabled={loading}
                  placeholder="tu@ejemplo.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.email ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors(prev => ({ ...prev, password: validatePassword(e.target.value) }))
                  }}
                  disabled={loading}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.password ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
                {!errors.password && password && (
                  <p className="text-xs text-gray-500 mt-1">
                    ✓ Contraseña válida
                  </p>
                )}
                {!password && (
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 8 caracteres, incluye números y letras
                  </p>
                )}
              </div>

              {/* Nombre del Negocio */}
              <div>
                <label htmlFor="nombreNegocio" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  id="nombreNegocio"
                  value={nombreNegocio}
                  onChange={(e) => {
                    setNombreNegocio(e.target.value)
                    setErrors(prev => ({ ...prev, nombreNegocio: validateNombreNegocio(e.target.value) }))
                  }}
                  disabled={loading}
                  placeholder="Ej: Dental Ayala"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.nombreNegocio ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
                {errors.nombreNegocio && (
                  <p className="text-sm text-red-500 mt-1">{errors.nombreNegocio}</p>
                )}
              </div>

              {/* Tipo de Negocio */}
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio *
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => {
                    setIndustry(e.target.value)
                    setErrors(prev => ({ ...prev, industry: validateIndustry(e.target.value) }))
                  }}
                  disabled={loading}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    errors.industry ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="dentista">🦷 Dentista / Odontología</option>
                  <option value="spa">💆 Spa / Estética</option>
                  <option value="veterinaria">🐕 Veterinaria</option>
                  <option value="gym">💪 Gimnasio / Fitness</option>
                  <option value="medico">⚕️ Consultorio Médico</option>
                  <option value="salon">💇 Salón de Belleza</option>
                  <option value="psicologo">🧠 Psicología / Terapia</option>
                  <option value="otro">📋 Otro</option>
                </select>
                {errors.industry && (
                  <p className="text-sm text-red-500 mt-1">{errors.industry}</p>
                )}
              </div>

              {/* Subdominio */}
              <div>
                <label htmlFor="subdominio" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu página será:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="subdominio"
                    value={subdominio}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')
                      setSubdominio(value)
                      setSubdominioManual(true)
                      setErrors(prev => ({ ...prev, subdominio: validateSubdominio(value) }))
                    }}
                    onFocus={() => setSubdominioManual(true)}
                    disabled={loading}
                    placeholder="dentalayala"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed ${
                      errors.subdominio ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  <span className="text-gray-500 font-medium">.cito.mx</span>
                </div>
                
                {errors.subdominio && (
                  <p className="text-sm text-red-500 mt-1">{errors.subdominio}</p>
                )}
                
                {!errors.subdominio && subdominio && subdominioChecking && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                    Verificando disponibilidad...
                  </p>
                )}
                
                {!errors.subdominio && subdominio && !subdominioChecking && subdominioDisponible === true && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {subdominio}.cito.mx está disponible
                  </p>
                )}
                
                {!errors.subdominio && subdominio && !subdominioChecking && subdominioDisponible === false && (
                  <p className="text-xs text-red-500 mt-1">
                    ✗ {subdominio}.cito.mx ya está en uso
                  </p>
                )}
                
                {!subdominio && (
                  <p className="text-xs text-gray-500 mt-1">
                    Se genera automáticamente desde el nombre del negocio
                  </p>
                )}
              </div>

              {/* Términos */}
              <div>
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terminos"
                    checked={terminos}
                    onChange={(e) => {
                      setTerminos(e.target.checked)
                      setErrors(prev => ({ ...prev, terminos: '' }))
                    }}
                    disabled={loading}
                    className="mt-1 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="terminos" className="text-sm text-gray-600">
                    Acepto los{' '}
                    <a href="#" className="text-blue-500 hover:text-blue-600 font-medium">
                      términos y condiciones
                    </a>{' '}
                    y la{' '}
                    <a href="#" className="text-blue-500 hover:text-blue-600 font-medium">
                      política de privacidad
                    </a>
                  </label>
                </div>
                {errors.terminos && (
                  <p className="text-sm text-red-500 mt-2">{errors.terminos}</p>
                )}
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={loading || subdominioChecking}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creando cuenta...
                  </>
                ) : (
                  'Crear mi cuenta'
                )}
              </button>

              {/* Link a Login */}
              <p className="text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <a href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
                  Inicia sesión
                </a>
              </p>

            </form>
          </div>

          {/* Footer info */}
          <p className="text-center text-xs text-gray-500 mt-6">
            7 días gratis • Sin tarjeta de crédito • Cancela cuando quieras
          </p>

        </div>
      </main>
    </div>
  )
}