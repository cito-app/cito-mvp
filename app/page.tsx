export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-white mb-4">
          Cito.mx
        </h1>
        <p className="text-xl text-white/90 mb-8">
          Sitio de Citas
        </p>
        <div className="flex gap-4 justify-center">
          <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            Comenzar
          </button>
          <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
            Saber Más
          </button>
        </div>
      </div>
    </main>
  )
}