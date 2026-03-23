'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type SlotsDisponiblesProps = {
  selectedDate: Date
  negocioId: string
  colorPrimario: string
}

type TimeSlot = {
  time: string
  available: boolean
}

type Availability = {
  day_of_week: string
  start_time: string
  end_time: string
}

type Exception = {
  exception_date: string
  is_closed: boolean
  custom_start_time: string | null
  custom_end_time: string | null
}

export default function SlotsDisponibles({ 
  selectedDate, 
  negocioId,
  colorPrimario 
}: SlotsDisponiblesProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [duracionCita, setDuracionCita] = useState<number>(60)

  useEffect(() => {
    const loadSlots = async () => {
      setLoading(true)
      console.log('🕐 Calculando slots para fecha:', selectedDate)

      // Cargar duración de cita del negocio
      const { data: userData } = await supabase
        .from('users')
        .select('duracion_cita')
        .eq('id', negocioId)
        .single()

      const duracion = userData?.duracion_cita || 60
      setDuracionCita(duracion)
      console.log('⏱️ Duración de cita:', duracion, 'minutos')

      // Obtener día de la semana
      const dayNames = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
      const dayOfWeek = dayNames[selectedDate.getDay()]
      console.log('📅 Día de la semana:', dayOfWeek)

      // Verificar si hay excepción para este día
      const dateStr = selectedDate.toISOString().split('T')[0]
      const { data: exceptions } = await supabase
        .from('availability_exceptions')
        .select('*')
        .eq('user_id', negocioId)
        .eq('exception_date', dateStr)
        .single()

      console.log('🔍 Excepción encontrada:', exceptions)

      let blocksToUse: { start_time: string; end_time: string }[] = []

      if (exceptions) {
        // Día con excepción
        if (exceptions.is_closed) {
          console.log('🔴 Día cerrado por excepción')
          setSlots([])
          setLoading(false)
          return
        } else if (exceptions.custom_start_time && exceptions.custom_end_time) {
          // Horario especial
          console.log('🟡 Horario especial:', exceptions.custom_start_time, '-', exceptions.custom_end_time)
          blocksToUse = [{
            start_time: exceptions.custom_start_time,
            end_time: exceptions.custom_end_time
          }]
        }
      } else {
        // Horario regular
        const { data: availability } = await supabase
          .from('availability')
          .select('start_time, end_time')
          .eq('user_id', negocioId)
          .eq('day_of_week', dayOfWeek)

        console.log('📊 Bloques de horario regular:', availability)
        blocksToUse = availability || []
      }

      // Calcular slots
      const calculatedSlots = calculateSlots(blocksToUse, duracion)
      console.log('✅ Slots calculados:', calculatedSlots.length)
      setSlots(calculatedSlots)
      setLoading(false)
    }

    loadSlots()
  }, [selectedDate, negocioId])

  // Calcular slots por bloques de tiempo
  const calculateSlots = (
    blocks: { start_time: string; end_time: string }[],
    duration: number
  ): TimeSlot[] => {
    const allSlots: TimeSlot[] = []

    blocks.forEach(block => {
      const startMinutes = timeToMinutes(block.start_time)
      const endMinutes = timeToMinutes(block.end_time)
      
      let currentMinutes = startMinutes

      while (currentMinutes + duration <= endMinutes) {
        const timeStr = minutesToTime(currentMinutes)
        allSlots.push({
          time: timeStr,
          available: true // Por ahora todos disponibles, después validar con reservas
        })
        currentMinutes += duration
      }
    })

    // Ordenar por hora
    allSlots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

    return allSlots
  }

  // Convertir HH:MM a minutos
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Convertir minutos a HH:MM
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Formatear hora para mostrar
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Handler de selección
  const handleSelectSlot = (time: string) => {
    setSelectedSlot(time)
    console.log('✅ Slot seleccionado:', time)
  }

  if (loading) {
    return (
      <div className="mt-6 flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ No hay horarios disponibles para este día
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Horarios disponibles
        </h3>
        <p className="text-sm text-gray-600">
          {selectedDate.toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })} • Duración: {duracionCita} minutos
        </p>
      </div>

      {/* Grid de slots */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => handleSelectSlot(slot.time)}
            disabled={!slot.available}
            className={`
              px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${selectedSlot === slot.time
                ? 'text-white shadow-md'
                : slot.available
                ? 'bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 hover:shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
            style={
              selectedSlot === slot.time
                ? { backgroundColor: colorPrimario, borderColor: colorPrimario }
                : {}
            }
          >
            {formatTime(slot.time)}
          </button>
        ))}
      </div>

      {/* Resumen de selección */}
      {selectedSlot && (
        <div 
          className="mt-6 p-4 rounded-lg border-2"
          style={{ 
            backgroundColor: `${colorPrimario}10`,
            borderColor: `${colorPrimario}40`
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Horario seleccionado
              </p>
              <p className="text-lg font-bold" style={{ color: colorPrimario }}>
                {formatTime(selectedSlot)} ({duracionCita} min)
              </p>
            </div>
            <button
              className="px-6 py-2.5 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: colorPrimario }}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* Info adicional */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Los horarios mostrados están en tu zona horaria local
        </p>
      </div>
    </div>
  )
}