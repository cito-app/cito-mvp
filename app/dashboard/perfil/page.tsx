'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Tipos
type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'

type TimeBlock = {
  id: string
  start_time: string
  end_time: string
}

type DaySchedule = {
  day: DayOfWeek
  is_available: boolean
  blocks: TimeBlock[]
}

export default function HorariosPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'lunes', is_available: false, blocks: [] },
    { day: 'martes', is_available: false, blocks: [] },
    { day: 'miercoles', is_available: false, blocks: [] },
    { day: 'jueves', is_available: false, blocks: [] },
    { day: 'viernes', is_available: false, blocks: [] },
    { day: 'sabado', is_available: false, blocks: [] },
    { day: 'domingo', is_available: false, blocks: [] },
  ])

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('lunes')

  // Estados del modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [modalError, setModalError] = useState('')
  const [modalWarning, setModalWarning] = useState('')

  // Estados del modal de copiar
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [selectedDaysToCopy, setSelectedDaysToCopy] = useState<DayOfWeek[]>([])
  const [copying, setCopying] = useState(false)

  const dayNames: Record<DayOfWeek, string> = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'domingo': 'Domingo'
  }

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error || !data.session) {
        router.push('/auth/login')
        return
      }

      setSession(data.session)

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (!userError && user) {
        setUserData(user)
      }

      await loadSchedule(data.session.user.id)
      setLoading(false)
    }

    getSession()
  }, [router])

  const loadSchedule = async (userId: string) => {
    const { data: availability, error } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error loading schedule:', error)
      return
    }

    if (availability && availability.length > 0) {
      const newSchedule: DaySchedule[] = [
        { day: 'lunes', is_available: false, blocks: [] },
        { day: 'martes', is_available: false, blocks: [] },
        { day: 'miercoles', is_available: false, blocks: [] },
        { day: 'jueves', is_available: false, blocks: [] },
        { day: 'viernes', is_available: false, blocks: [] },
        { day: 'sabado', is_available: false, blocks: [] },
        { day: 'domingo', is_available: false, blocks: [] },
      ]

      availability.forEach((slot: any) => {
        const dayIndex = newSchedule.findIndex(d => d.day === slot.day_of_week)
        if (dayIndex !== -1) {
          newSchedule[dayIndex].blocks.push({
            id: slot.id,
            start_time: slot.start_time,
            end_time: slot.end_time
          })
          newSchedule[dayIndex].is_available = true
        }
      })

      setSchedule(newSchedule)
    }
  }

  const toggleDayAvailability = async (day: DayOfWeek) => {
    const dayData = schedule.find(d => d.day === day)
    
    if (dayData?.is_available && dayData.blocks.length > 0) {
      const confirmed = confirm(
        `¿Deseas desactivar ${dayNames[day]}? Esto eliminará todos los horarios configurados para este día.`
      )
      
      if (!confirmed) return

      const blockIds = dayData.blocks.map(b => b.id)
      
      const { error } = await supabase
        .from('availability')
        .delete()
        .in('id', blockIds)

      if (error) {
        console.error('Error deleting blocks:', error)
        alert('Error al eliminar horarios')
        return
      }

      setSchedule(prev => prev.map(d => 
        d.day === day 
          ? { ...d, is_available: false, blocks: [] }
          : d
      ))
    } else {
      setSchedule(prev => prev.map(d => 
        d.day === day 
          ? { ...d, is_available: !d.is_available }
          : d
      ))
    }
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const validateTimeBlock = (): { valid: boolean; hasWarning: boolean; warningMessage: string } => {
    setModalError('')
    
    // Validación básica: hora fin > hora inicio
    if (endTime <= startTime) {
      setModalError('La hora de fin debe ser posterior a la hora de inicio')
      return { valid: false, hasWarning: false, warningMessage: '' }
    }

    // Validación: duración mínima de 30 minutos
    const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime)
    if (durationMinutes < 30) {
      setModalError('El bloque debe tener una duración mínima de 30 minutos')
      return { valid: false, hasWarning: false, warningMessage: '' }
    }

    // Validar solapamiento
    const dayData = schedule.find(d => d.day === selectedDay)
    if (dayData) {
      const otherBlocks = dayData.blocks.filter(b => 
        modalMode === 'edit' ? b.id !== editingBlock?.id : true
      )

      for (const block of otherBlocks) {
        if (
          (startTime >= block.start_time && startTime < block.end_time) ||
          (endTime > block.start_time && endTime <= block.end_time) ||
          (startTime <= block.start_time && endTime >= block.end_time)
        ) {
          setModalError(`Este horario se solapa con ${block.start_time} - ${block.end_time}`)
          return { valid: false, hasWarning: false, warningMessage: '' }
        }
      }

      // Validación: máximo 6 bloques por día
      if (modalMode === 'add' && otherBlocks.length >= 6) {
        setModalError('Máximo 6 bloques de horarios por día')
        return { valid: false, hasWarning: false, warningMessage: '' }
      }
    }

    // Detectar warnings (NO los mostramos aún, solo los retornamos)
    let warningMessage = ''
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    
    if (startMinutes < 360) { // Antes de 6:00 AM
      warningMessage = 'Horario muy temprano: ¿Seguro que atiendes antes de las 6:00 AM?'
    } else if (endMinutes > 1380) { // Después de 11:00 PM
      warningMessage = 'Horario muy tarde: ¿Seguro que atiendes después de las 11:00 PM?'
    }

    return { valid: true, hasWarning: warningMessage !== '', warningMessage }
  }

  const openAddModal = () => {
    setModalMode('add')
    setEditingBlock(null)
    setStartTime('09:00')
    setEndTime('18:00')
    setModalError('')
    setModalWarning('')
    setShowModal(true)
  }

  const openEditModal = (block: TimeBlock) => {
    setModalMode('edit')
    setEditingBlock(block)
    setStartTime(block.start_time)
    setEndTime(block.end_time)
    setModalError('')
    setModalWarning('')
    setShowModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setShowModal(false)
    setModalError('')
    setModalWarning('')
  }

  const handleSaveBlock = async () => {
    setModalError('')
    setModalWarning('')

    // Validar el horario
    const validation = validateTimeBlock()
    
    if (!validation.valid) {
      return // Si hay error, detener aquí
    }

    // Si hay warning, mostrar confirm ANTES de proceder
    if (validation.hasWarning) {
      const confirmed = confirm(
        `⚠️ ${validation.warningMessage}\n\n¿Deseas continuar y guardar este horario de todas formas?`
      )
      
      if (!confirmed) {
        setModalWarning(validation.warningMessage) // Mostrar warning en el modal
        return // No guardar
      }
    }

    setSaving(true)

    try {
      if (modalMode === 'add') {
        const { data, error } = await supabase
          .from('availability')
          .insert({
            user_id: session.user.id,
            day_of_week: selectedDay,
            start_time: startTime,
            end_time: endTime
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating block:', error)
          setModalError('Error al guardar el horario')
          setSaving(false)
          return
        }

        setSchedule(prev => prev.map(d => 
          d.day === selectedDay
            ? {
                ...d,
                is_available: true,
                blocks: [...d.blocks, {
                  id: data.id,
                  start_time: data.start_time,
                  end_time: data.end_time
                }].sort((a, b) => a.start_time.localeCompare(b.start_time))
              }
            : d
        ))

      } else {
        const { error } = await supabase
          .from('availability')
          .update({
            start_time: startTime,
            end_time: endTime
          })
          .eq('id', editingBlock!.id)

        if (error) {
          console.error('Error updating block:', error)
          setModalError('Error al actualizar el horario')
          setSaving(false)
          return
        }

        setSchedule(prev => prev.map(d => 
          d.day === selectedDay
            ? {
                ...d,
                blocks: d.blocks.map(b => 
                  b.id === editingBlock!.id
                    ? { ...b, start_time: startTime, end_time: endTime }
                    : b
                ).sort((a, b) => a.start_time.localeCompare(b.start_time))
              }
            : d
        ))
      }

      setSaving(false)
      setShowModal(false)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      setModalError('Error inesperado. Intenta de nuevo.')
      setSaving(false)
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    const confirmed = confirm('¿Estás seguro de eliminar este horario?')
    if (!confirmed) return

    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('Error deleting block:', error)
      alert('Error al eliminar el horario')
      return
    }

    setSchedule(prev => prev.map(d => {
      const newBlocks = d.blocks.filter(b => b.id !== blockId)
      return d.day === selectedDay
        ? {
            ...d,
            blocks: newBlocks,
            is_available: newBlocks.length > 0
          }
        : d
    }))
  }

  const openCopyModal = () => {
    const currentDay = schedule.find(d => d.day === selectedDay)
    if (!currentDay || currentDay.blocks.length === 0) {
      alert('No hay horarios configurados para copiar')
      return
    }

    setSelectedDaysToCopy([])
    setShowCopyModal(true)
  }

  const toggleDayToCopy = (day: DayOfWeek) => {
    if (day === selectedDay) return

    setSelectedDaysToCopy(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleCopySchedule = async () => {
    if (selectedDaysToCopy.length === 0) {
      alert('Selecciona al menos un día')
      return
    }

    const currentDay = schedule.find(d => d.day === selectedDay)
    if (!currentDay || currentDay.blocks.length === 0) {
      alert('No hay horarios para copiar')
      return
    }

    const confirmed = confirm(
      `¿Copiar los ${currentDay.blocks.length} horarios de ${dayNames[selectedDay]} a ${selectedDaysToCopy.length} día(s)? Esto eliminará los horarios existentes en esos días.`
    )

    if (!confirmed) return

    setCopying(true)

    try {
      // Eliminar horarios existentes de los días seleccionados
      for (const day of selectedDaysToCopy) {
        const dayData = schedule.find(d => d.day === day)
        if (dayData && dayData.blocks.length > 0) {
          const blockIds = dayData.blocks.map(b => b.id)
          await supabase
            .from('availability')
            .delete()
            .in('id', blockIds)
        }
      }

      // Copiar horarios
      const newBlocks = []
      for (const day of selectedDaysToCopy) {
        for (const block of currentDay.blocks) {
          newBlocks.push({
            user_id: session.user.id,
            day_of_week: day,
            start_time: block.start_time,
            end_time: block.end_time
          })
        }
      }

      const { data, error } = await supabase
        .from('availability')
        .insert(newBlocks)
        .select()

      if (error) {
        console.error('Error copying schedule:', error)
        alert('Error al copiar horarios')
        setCopying(false)
        return
      }

      // Actualizar estado local
      await loadSchedule(session.user.id)

      setCopying(false)
      setShowCopyModal(false)
      alert(`✅ Horarios copiados exitosamente a ${selectedDaysToCopy.length} día(s)`)

    } catch (error: any) {
      console.error('Unexpected error:', error)
      alert('Error inesperado al copiar horarios')
      setCopying(false)
    }
  }

  const getSelectedDaySchedule = () => {
    return schedule.find(d => d.day === selectedDay)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Cargando horarios...</p>
        </div>
      </div>
    )
  }

  if (!session || !userData) {
    return null
  }

  const selectedDayData = getSelectedDaySchedule()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⏰ Horarios de Atención
          </h1>
          <p className="text-gray-600">
            Configura tu disponibilidad semanal para recibir citas
          </p>
        </div>

        <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-900 font-medium">¿Cómo funciona?</p>
              <p className="text-sm text-blue-800 mt-1">
                Define los días y horarios en los que atiendes. Tus clientes solo podrán agendar citas dentro de estos bloques de disponibilidad.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                📅 Días de la Semana
              </h2>
              
              <div className="space-y-2">
                {schedule.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(day.day)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition ${
                      selectedDay === day.day
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        day.is_available ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className={`font-medium ${
                        selectedDay === day.day ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {dayNames[day.day]}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {day.blocks.length > 0 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {day.blocks.length} {day.blocks.length === 1 ? 'bloque' : 'bloques'}
                        </span>
                      )}
                      <svg className={`w-5 h-5 ${
                        selectedDay === day.day ? 'text-blue-500' : 'text-gray-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p className="flex items-center justify-between mb-2">
                    <span>Días activos:</span>
                    <span className="font-semibold text-gray-900">
                      {schedule.filter(d => d.is_available).length} / 7
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Total de bloques:</span>
                    <span className="font-semibold text-gray-900">
                      {schedule.reduce((sum, d) => sum + d.blocks.length, 0)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {dayNames[selectedDay]}
                  </h2>
                  
                  <div className="flex items-center gap-3">
                    {selectedDayData?.blocks && selectedDayData.blocks.length > 0 && (
                      <button
                        onClick={openCopyModal}
                        className="px-3 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar a otros días
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleDayAvailability(selectedDay)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                        selectedDayData?.is_available ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                          selectedDayData?.is_available ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDayData?.is_available 
                    ? 'Día habilitado para recibir citas' 
                    : 'Día deshabilitado - No recibirás citas'}
                </p>
              </div>

              <div className="p-6">
                {!selectedDayData?.is_available ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">Día no disponible</p>
                    <p className="text-sm text-gray-500">
                      Activa el día usando el switch arriba para configurar horarios
                    </p>
                  </div>
                ) : selectedDayData.blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">Sin horarios configurados</p>
                    <p className="text-sm text-gray-500 mb-6">
                      Agrega bloques de tiempo para este día
                    </p>
                    <button 
                      onClick={openAddModal}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
                    >
                      + Agregar Horario
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayData.blocks.map((block) => (
                      <div 
                        key={block.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-gray-900">
                            {block.start_time} - {block.end_time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(block)}
                            className="p-2 text-gray-400 hover:text-blue-500 rounded transition"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded transition"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={openAddModal}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-500 font-medium rounded-lg transition"
                    >
                      + Agregar otro horario
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Modal Agregar/Editar Horario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'add' ? '➕ Agregar Horario' : '✏️ Editar Horario'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {dayNames[selectedDay]}
              </p>
            </div>

            <div className="p-6 space-y-4">
              
              {modalError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{modalError}</p>
                </div>
              )}

              {modalWarning && !modalError && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">⚠️ {modalWarning}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 Los bloques deben tener mínimo 30 minutos de duración y no pueden solaparse con otros horarios
                </p>
              </div>

            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={handleSaveBlock}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Guardando...
                  </>
                ) : (
                  modalMode === 'add' ? 'Agregar Horario' : 'Guardar Cambios'
                )}
              </button>
              
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg border border-gray-200 transition"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Copiar Horarios */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Copiar Horarios
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Copiar de {dayNames[selectedDay]} a otros días
              </p>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona los días donde quieres copiar estos horarios:
              </p>

              <div className="space-y-2">
                {schedule.map((day) => {
                  if (day.day === selectedDay) return null

                  return (
                    <button
                      key={day.day}
                      onClick={() => toggleDayToCopy(day.day)}
                      disabled={copying}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition ${
                        selectedDaysToCopy.includes(day.day)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${copying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`font-medium ${
                        selectedDaysToCopy.includes(day.day) ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {dayNames[day.day]}
                      </span>
                      
                      {selectedDaysToCopy.includes(day.day) && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      
                      {day.blocks.length > 0 && !selectedDaysToCopy.includes(day.day) && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {day.blocks.length} existente(s)
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedDaysToCopy.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Esto eliminará los horarios existentes en los días seleccionados
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={handleCopySchedule}
                disabled={copying || selectedDaysToCopy.length === 0}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {copying ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Copiando...
                  </>
                ) : (
                  `Copiar a ${selectedDaysToCopy.length} día(s)`
                )}
              </button>
              
              <button
                onClick={() => setShowCopyModal(false)}
                disabled={copying}
                className="px-4 py-3 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium rounded-lg border border-gray-200 transition"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}