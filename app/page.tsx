'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/Card'

interface Business {
  id: string
  nombre_negocio: string
  subdominio: string
  industry: string
  color_primario: string
}

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBusinesses() {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre_negocio, subdominio, industry, color_primario')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error:', error)
      } else {
        setBusinesses(data || [])
      }
      setLoading(false)
    }

    fetchBusinesses()
  }, [])

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      
      {/* Header */}
      <header className="text-center mb-16">
        <h1 className="text-6xl font-bold text-gray-900 mb-3">
          🦷 Cito.mx
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Tu Sitio de Citas
        </p>
        <p className="text-gray-500">
          Sistema de citas para negocios mexicanos
        </p>
      </header>

      {/* Grid de Cards - Features */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        
        <Card
          icon="🎨"
          title="White Label"
          description="Página personalizada con tu marca. Como doctoraayala.cito.mx"
          color="#3B82F6"
        />

        <Card
          icon="📱"
          title="SMS Automáticos"
          description="Confirmación instantánea. 40 SMS incluidos, $5 por SMS extra."
          color="#8B5CF6"
        />

        <Card
          icon="💰"
          title="$300/mes"
          description="Precio fijo. Sin comisiones por cita. Cancela cuando quieras."
          color="#10B981"
        />

      </div>

      {/* Negocios Registrados */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          🏢 Negocios Usando Cito.mx
        </h2>

        {loading ? (
          <p className="text-center text-gray-600">Cargando negocios...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <div 
                key={business.id}
                className="p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition"
                style={{ backgroundColor: business.color_primario }}
              >
                <h3 className="text-xl font-bold mb-2">
                  {business.nombre_negocio}
                </h3>
                <p className="text-white/80 text-sm mb-1">
                  {business.subdominio}.cito.mx
                </p>
                <p className="text-white/60 text-xs uppercase">
                  {business.industry}
                </p>
              </div>
            ))}
          </div>
        )}
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