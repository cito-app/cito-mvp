'use client'

import { useState } from 'react'

type FormularioReservaProps = {
  selectedDate: Date
  selectedTime: string
  duracionCita: number
  negocioNombre: string
  colorPrimario: string
  onBack: () => void
}

export default function FormularioReserva({
  selectedDate,
  selectedTime,
  duracionCita,
  negocioNombre,
  colorPrimario,
  onBack
}: FormularioReservaProps) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formatear hora para mostrar
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!nombre.trim()) {
      alert('Por favor ingresa tu nombre')
      return
    }
    
    if (!email.trim()) {
      alert('Por favor ingresa tu email')
      return
    }
    
    if (!telefono.trim()) {
      alert('Por favor ingresa tu teléfono')
      return
    }

    setIsSubmitting(true)
    
    // Por ahora solo mostramos los datos en consola
    console.log('📝 Datos del formulario:', {
      nombre,
      email,
      telefono,
      fecha: selectedDate,
      hora: selectedTime,
      duracion: duracionCita
    })

    // Simular proceso
    setTimeout(() => {
      alert('¡Reserva lista! (Por ahora solo simulación - en S9 se guardará en BD)')
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Completa tu reserva
        </h2>
        <p className="text-sm text-gray-600">
          Ingresa tus datos para confirmar tu cita
        </p>
      </div>

      {/* Resumen de la cita */}
      <div 
        className="mb-6 p-4 rounded-lg border-2"
        style={{ 
          backgroundColor: `${colorPrimario}08`,
          borderColor: `${colorPrimario}30`
        }}
      >
        <p className="text-xs font-medium text-gray-600 mb-2">RESUMEN DE TU CITA</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="font-medium">Lugar:</span> {negocioNombre}
          </p>
          <p className="text-sm">
            <span className="font-medium">Fecha:</span>{' '}
            {selectedDate.toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
          <p className="text-sm">
            <span className="font-medium">Hora:</span> {formatTime(selectedTime)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Duración:</span> {duracionCita} minutos
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre completo */}
        <div>
          <label 
            htmlFor="nombre" 
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan Pérez García"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-900"
            style={{ 
              focusRingColor: colorPrimario 
            }}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Correo electrónico <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej: juan.perez@email.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-900"
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <label 
            htmlFor="telefono" 
            className="block text-sm font-medium text-gray-900 mb-1"
          >
            Teléfono celular <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 443 123 4567"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 text-gray-900"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Recibirás confirmación y recordatorios por SMS
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colorPrimario }}
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar reserva'}
          </button>
        </div>
      </form>

      {/* Info adicional */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          🔒 <strong>Tus datos están seguros.</strong> Solo los usaremos para confirmar tu cita y enviarte recordatorios.
        </p>
      </div>
    </div>
  )
}