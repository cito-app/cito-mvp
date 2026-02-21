import Card from '@/components/Card'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      
      {/* Header */}
      <header className="text-center mb-16">
        <h1 className="text-6xl font-bold text-gray-900 mb-3">
          🦷 Cito.mx
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Sistema de citas para dentistas mexicanos
        </p>
        <p className="text-gray-500">
          Tu marca, tu página, tus clientes
        </p>
      </header>

      {/* Grid de Cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <Card
          icon="🎨"
          title="White Label"
          description="Cada empresa tiene su propia página personalizada. Su logo, sus colores, su marca. Como doctoraayala.cito.mx"
          color="#3B82F6"
        />

        <Card
          icon="📱"
          title="SMS Automáticos"
          description="Confirmación instantánea por SMS al agendar. Reduce el no-show de 30% a menos de 10%."
          color="#8B5CF6"
        />

        <Card
          icon="💰"
          title="$300/mes"
          description="Precio fijo, citas ilimitadas. Sin comisiones por cita, sin sorpresas. Cancela cuando quieras."
          color="#10B981"
        />

        <Card
          icon="📊"
          title="Dashboard Simple"
          description="Ve todas tus citas del día en un solo lugar. Cancela o reprograma con un click."
          color="#EF4444"
        />

      </div>

      {/* Footer */}
      <footer className="text-center mt-16">
        <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition shadow-lg">
          Comenzar Prueba Gratis
        </button>
        <p className="text-gray-500 text-sm mt-4">
          7 días gratis • Sin tarjeta de crédito
        </p>
      </footer>

    </main>
  )
}