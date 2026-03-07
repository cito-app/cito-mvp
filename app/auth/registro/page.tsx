export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
        <a href="/" className="inline-flex items-center gap-3 hover:opacity-80 transition">
       {/* Usar logo real */}
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

          {/* Form Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
            <form className="space-y-6">
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="tu@ejemplo.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres, incluye números y letras
                </p>
              </div>

              {/* Nombre del Negocio */}
              <div>
                <label htmlFor="nombreNegocio" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  id="nombreNegocio"
                  placeholder="Ej: Dental Ayala"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>

              {/* Tipo de Negocio */}
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Negocio *
                </label>
                <select
                  id="industry"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white"
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
              </div>

              {/* Subdominio Preview */}
              <div>
                <label htmlFor="subdominio" className="block text-sm font-medium text-gray-700 mb-2">
                  Tu página será:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id="subdominio"
                    placeholder="dentalayala"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                  <span className="text-gray-500 font-medium">.cito.mx</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas y números, sin espacios
                </p>
              </div>

              {/* Términos */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terminos"
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