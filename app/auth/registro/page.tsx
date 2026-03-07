'use client'

import { useState } from 'react'

export default function RegistroPage() {
  // Estados para cada campo
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [industry, setIndustry] = useState('')
  const [subdominio, setSubdominio] = useState('')
  const [terminos, setTerminos] = useState(false)

  // Estados para errores
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    nombreNegocio: '',
    industry: '',
    subdominio: '',
    terminos: ''
  })

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
    if (!/^[a-z0-9]+$/.test(subdominio)) return 'Solo letras minúsculas y números, sin espacios'
    if (subdominio.length < 3) return 'Mínimo 3 caracteres'
    return ''
  }

  // Manejar submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

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
      terminos: terminosError
    })

    // Si hay errores, no continuar
    if (emailError || passwordError || nombreError || industryError || subdominioError || terminosError) {
      console.log('❌ Formulario tiene errores')
      return
    }

    // Si todo está bien
    console.log('✅ Formulario válido!')
    console.log({
      email,
      password,
      nombreNegocio,
      industry,
      subdominio,
      terminos
    })

    // Aquí mañana conectaremos con Supabase
    alert('✅ Formulario válido! Mañana lo conectaremos a la base de datos.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a href="/" className="inline-flex items-center gap-3 hover:opacity-80 transition">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-black">C</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Cito.mx</span>
            </div>
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
                  placeholder="tu@ejemplo.com"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition ${
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
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition ${
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
                  placeholder="Ej: Dental Ayala"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white ${
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
                      setErrors(prev => ({ ...prev, subdominio: validateSubdominio(value) }))
                    }}
                    placeholder="dentalayala"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition ${
                      errors.subdominio ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  <span className="text-gray-500 font-medium">.cito.mx</span>
                </div>
                {errors.subdominio && (
                  <p className="text-sm text-red-500 mt-1">{errors.subdominio}</p>
                )}
                {!errors.subdominio && subdominio && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {subdominio}.cito.mx está disponible
                  </p>
                )}
                {!subdominio && (
                  <p className="text-xs text-gray-500 mt-1">
                    Solo letras minúsculas y números, sin espacios
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
                    className="mt-1 w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20"
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
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition"
              >
                Crear mi cuenta
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