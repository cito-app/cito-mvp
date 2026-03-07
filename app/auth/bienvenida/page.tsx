export default function BienvenidaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        
        <div className="mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          Bienvenido a Cito.mx
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Tu cuenta ha sido creada exitosamente
        </p>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="space-y-4">
            
            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Revisa tu email</p>
                <p className="text-xs text-gray-500">Te enviamos un link de confirmacion</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Personaliza tu pagina</p>
                <p className="text-xs text-gray-500">Logo, colores, horarios</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-left">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Recibe tu primera cita</p>
                <p className="text-xs text-gray-500">Confirmacion automatica por SMS</p>
              </div>
            </div>

          </div>
        </div>

        <a
          href="/"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition"
        >
          Ir a mi dashboard
        </a>

        <p className="text-xs text-gray-500 mt-6">
          Tienes 7 dias de prueba gratis - Sin tarjeta de credito
        </p>

      </div>
    </div>
  )
}
