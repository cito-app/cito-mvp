import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Negocio no encontrado
        </h1>
        <p className="text-gray-600 mb-6 max-w-md">
          El subdominio que estás buscando no existe o no está disponible.
        </p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
        >
          Ir a Cito.mx
        </Link>
      </div>
    </div>
  )
}