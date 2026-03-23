'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CalendarioPublico from './components/CalendarioPublico'
import SlotsDisponibles from './components/SlotsDisponibles'


type Negocio = {
  id: string
  nombre_negocio: string
  industry: string
  logo_url: string | null
  color_primario: string
  subdominio: string
}

export default function PaginaPublicaNegocio() {
  const pathname = usePathname()
  const subdominio = pathname.split('/')[1]
  
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    const loadNegocio = async () => {
      if (!subdominio) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, nombre_negocio, industry, logo_url, color_primario, subdominio')
        .eq('subdominio', subdominio)
        .single()

      console.log('🎯 Negocio ID:', data?.id)
      console.log('🎯 Negocio completo:', data)

      if (error || !data) {
        setNotFound(true)
      } else {
        setNegocio(data)
      }
      
      setLoading(false)
    }

    loadNegocio()
  }, [subdominio])

  const industryEmojis: { [key: string]: string } = {
    'dentista': '🦷',
    'spa': '💆',
    'veterinaria': '🐕',
    'gym': '💪',
    'medico': '⚕️',
    'salon': '💇',
    'psicologo': '🧠',
    'otro': '📋'
  }

  const industryNames: { [key: string]: string } = {
    'dentista': 'Consultorio Dental',
    'spa': 'Spa & Estética',
    'veterinaria': 'Clínica Veterinaria',
    'gym': 'Gimnasio',
    'medico': 'Consultorio Médico',
    'salon': 'Salón de Belleza',
    'psicologo': 'Consultorio de Psicología',
    'otro': 'Servicios Profesionales'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (notFound || !negocio) {
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
          <a 
            href="/"
            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
          >
            Ir a Cito.mx
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white border-b border-gray-200 shadow-sm"
        style={{ 
          borderBottomColor: negocio.color_primario ? `${negocio.color_primario}20` : undefined 
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {negocio.logo_url ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img 
                  src={negocio.logo_url} 
                  alt={negocio.nombre_negocio}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: `${negocio.color_primario}20` }}
              >
                {industryEmojis[negocio.industry] || '📋'}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {negocio.nombre_negocio}
              </h1>
              <p className="text-sm text-gray-600">
                {industryNames[negocio.industry] || 'Servicios Profesionales'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Hero Section con Calendario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <div className="mb-6 text-center">
            <div 
              className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4"
              style={{ 
                backgroundColor: `${negocio.color_primario}15`,
                color: negocio.color_primario 
              }}
            >
              Reserva en línea
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Agenda tu cita
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Selecciona el día y hora que mejor te convenga
            </p>
          </div>

{/* Calendario */}
<CalendarioPublico 
  negocioId={negocio.id}
  colorPrimario={negocio.color_primario}
  onDateSelect={setSelectedDate}
/>

{/* Slots disponibles */}
{selectedDate && (
  <SlotsDisponibles
    selectedDate={selectedDate}
    negocioId={negocio.id}
    colorPrimario={negocio.color_primario}
  />
)}




        </div>

        {/* Info adicional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-1">Fácil y Rápido</h3>
            <p className="text-sm text-gray-600">
              Agenda en menos de 2 minutos
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-900 mb-1">Confirmación SMS</h3>
            <p className="text-sm text-gray-600">
              Recibe recordatorios de tu cita
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-1">100% Seguro</h3>
            <p className="text-sm text-gray-600">
              Tus datos están protegidos
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>
            Powered by <span className="font-semibold text-gray-900">Cito.mx</span>
          </p>
        </div>
      </footer>
    </div>
  )
}        