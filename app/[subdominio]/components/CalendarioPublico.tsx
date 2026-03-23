'use client'

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { supabase } from '@/lib/supabase'

type CalendarioPublicoProps = {
  negocioId: string
  colorPrimario: string
  onDateSelect: (date: Date | null) => void
}

type Availability = {
  day_of_week: string
  start_time: string
  end_time: string
}

type Exception = {
  exception_date: string
  is_closed: boolean
}

export default function CalendarioPublico({ 
  negocioId, 
  colorPrimario,
  onDateSelect
}: CalendarioPublicoProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar disponibilidad y excepciones
  useEffect(() => {
    const loadData = async () => {
      console.log('🔍 Cargando datos para negocio:', negocioId)

      // Cargar horarios regulares
      const { data: availData, error: availError } = await supabase
        .from('availability')
        .select('day_of_week, start_time, end_time')
        .eq('user_id', negocioId)

      console.log('📊 Horarios cargados:', availData)
      console.log('❌ Error horarios:', availError)

      if (availData) {
        setAvailability(availData)
      }

      // Cargar excepciones
      const { data: exceptData, error: exceptError } = await supabase
        .from('availability_exceptions')
        .select('exception_date, is_closed')
        .eq('user_id', negocioId)

      console.log('📊 Excepciones cargadas:', exceptData)
      console.log('❌ Error excepciones:', exceptError)

      if (exceptData) {
        setExceptions(exceptData)
      }

      setLoading(false)
    }

    loadData()
  }, [negocioId])

  // Mapeo de días en español a número
  const dayMap: { [key: string]: number } = {
    'domingo': 0,
    'lunes': 1,
    'martes': 2,
    'miercoles': 3,
    'jueves': 4,
    'viernes': 5,
    'sabado': 6
  }

  // Verificar si un día tiene disponibilidad regular
  const hasDayAvailability = (date: Date): boolean => {
    const dayOfWeek = date.getDay() // 0 = domingo, 1 = lunes, etc.
    const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayOfWeek)
    
    if (!dayName) {
      return false
    }

    return availability.some(a => a.day_of_week === dayName)
  }

  // Verificar si un día es excepción (cerrado)
  const isExceptionClosed = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    const exception = exceptions.find(e => e.exception_date === dateStr)
    return exception?.is_closed === true
  }

  // Verificar si un día está disponible
  const isDayAvailable = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // No permitir días pasados
    if (date < today) return false

    // Si es excepción cerrada, no disponible
    if (isExceptionClosed(date)) return false

    // Si tiene disponibilidad regular, disponible
    return hasDayAvailability(date)
  }

  // Clase personalizada para tiles del calendario
  const tileClassName = ({ date }: { date: Date }) => {
    const classes: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Día pasado
    if (date < today) {
      classes.push('dia-pasado')
      return classes.join(' ')
    }

    // Día con excepción cerrada
    if (isExceptionClosed(date)) {
      classes.push('dia-cerrado')
      return classes.join(' ')
    }

    // Día disponible
    if (hasDayAvailability(date)) {
      classes.push('dia-disponible')
    } else {
      classes.push('dia-no-disponible')
    }

    return classes.join(' ')
  }

  // Deshabilitar días no disponibles
  const tileDisabled = ({ date }: { date: Date }) => {
    return !isDayAvailable(date)
  }

  // Handler para selección de fecha
  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      console.log('📅 Fecha seleccionada:', value)
      setSelectedDate(value)
      onDateSelect(value)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="calendario-publico">
      <style jsx global>{`
        .react-calendar {
          width: 100%;
          max-width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          font-family: inherit;
          line-height: 1.5;
          background: white;
          padding: 1rem;
        }

        .react-calendar__navigation {
          display: flex;
          height: 44px;
          margin-bottom: 1rem;
        }

        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6;
          border-radius: 0.375rem;
        }

        .react-calendar__navigation button:disabled {
          background-color: transparent;
          color: #9ca3af;
        }

        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
        }

        .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        .react-calendar__tile {
          max-width: 100%;
          padding: 0.75rem 0.5rem;
          background: none;
          text-align: center;
          line-height: 1;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          position: relative;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #f3f4f6;
        }

        .react-calendar__tile--now {
          background: #eff6ff;
          font-weight: 600;
        }

        .react-calendar__tile--active {
          background: ${colorPrimario} !important;
          color: white !important;
          font-weight: 600;
        }

        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: ${colorPrimario} !important;
        }

        /* Días pasados */
        .dia-pasado {
          color: #d1d5db !important;
          background-color: #f9fafb !important;
          cursor: not-allowed !important;
        }

        /* Días disponibles */
        .dia-disponible {
          background-color: #d1fae5 !important;
          color: #065f46 !important;
          font-weight: 500;
        }

        .dia-disponible:enabled:hover {
          background-color: #a7f3d0 !important;
        }

        /* Días cerrados (excepciones) */
        .dia-cerrado {
          background-color: #fee2e2 !important;
          color: #991b1b !important;
          text-decoration: line-through;
          cursor: not-allowed !important;
        }

        /* Días no disponibles (sin horarios) */
        .dia-no-disponible {
          color: #9ca3af !important;
          cursor: not-allowed !important;
        }

        .react-calendar__tile:disabled {
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .react-calendar__tile {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }

          .react-calendar__navigation button {
            font-size: 0.875rem;
          }
        }
      `}</style>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Selecciona una fecha
        </h3>
        <p className="text-sm text-gray-600">
          Los días resaltados en verde tienen horarios disponibles
        </p>
        <p className="text-xs text-gray-500 mt-1">
          📅 Puedes agendar hasta 90 días de anticipación
        </p>
        
        {availability.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ⚠️ No hay horarios configurados para este negocio
          </div>
        )}
      </div>

      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        locale="es-MX"
        minDate={new Date()}
        maxDate={new Date(new Date().setDate(new Date().getDate() + 90))}
        tileClassName={tileClassName}
        tileDisabled={tileDisabled}
        next2Label={null}
        prev2Label={null}
      />

      {/* Leyenda */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span className="text-gray-700">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
          <span className="text-gray-700">Cerrado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
          <span className="text-gray-700">No disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-500"></div>
          <span className="text-gray-700">Hoy</span>
        </div>
      </div>
    </div>
  )
}