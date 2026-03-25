'use client'

import { useState, useEffect } from 'react'

type FormularioReservaProps = {
  selectedDate: Date
  selectedTime: string
  duracionCita: number
  negocioNombre: string
  colorPrimario: string
  onBack: () => void
}

type ValidationError = {
  nombre: string
  email: string
  telefono: string
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
  
  // Estados de validación
  const [touched, setTouched] = useState({
    nombre: false,
    email: false,
    telefono: false
  })

  const [errors, setErrors] = useState<ValidationError>({
    nombre: '',
    email: '',
    telefono: ''
  })

  // Validar nombre
  const validateNombre = (value: string): string => {
    if (!value.trim()) {
      return 'El nombre es requerido'
    }
    if (value.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres'
    }
    // Permitir solo letras, espacios, y acentos
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
    if (!nameRegex.test(value)) {
      return 'El nombre solo debe contener letras'
    }
    return ''
  }

  // Validar email
  const validateEmail = (value: string): string => {
    if (!value.trim()) {
      return 'El email es requerido'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Ingresa un email válido (ej: usuario@email.com)'
    }
    return ''
  }

  // Validar teléfono
  const validateTelefono = (value: string): string => {
    if (!value.trim()) {
      return 'El teléfono es requerido'
    }
    // Eliminar espacios y guiones para validar
    const cleanPhone = value.replace(/[\s-]/g, '')
    
    // Solo números
    if (!/^\d+$/.test(cleanPhone)) {
      return 'El teléfono solo debe contener números'
    }
    
    if (cleanPhone.length !== 10) {
      return 'El teléfono debe tener exactamente 10 dígitos'
    }
    return ''
  }

  // Validar en tiempo real
  useEffect(() => {
    if (touched.nombre) {
      setErrors(prev => ({ ...prev, nombre: validateNombre(nombre) }))
    }
  }, [nombre, touched.nombre])

  useEffect(() => {
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }))
    }
  }, [email, touched.email])

  useEffect(() => {
    if (touched.telefono) {
      setErrors(prev => ({ ...prev, telefono: validateTelefono(telefono) }))
    }
  }, [telefono, touched.telefono])

  // Verificar si el formulario es válido
  const isFormValid = (): boolean => {
    return (
      validateNombre(nombre) === '' &&
      validateEmail(email) === '' &&
      validateTelefono(telefono) === ''
    )
  }

  // Handler para marcar campo como touched
  const handleBlur = (field: 'nombre' | 'email' | 'telefono') => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

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
    
    // Marcar todos los campos como touched
    setTouched({
      nombre: true,
      email: true,
      telefono: true
    })

    // Validar todos los campos
    const nombreError = validateNombre(nombre)
    const emailError = validateEmail(email)
    const telefonoError = validateTelefono(telefono)

    setErrors({
      nombre: nombreError,
      email: emailError,
      telefono: telefonoError
    })

    // Si hay errores, no continuar
    if (nombreError || emailError || telefonoError) {
      alert('Por favor corrige los errores antes de continuar')
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
      
      // Limpiar formulario
      setNombre('')
      setEmail('')
      setTelefono('')
      setTouched({ nombre: false, email: false, telefono: false })
      setErrors({ nombre: '', email: '', telefono: '' })
    }, 1000)
  }

  // Determinar clase de border por estado
  const getBorderClass = (field: 'nombre' | 'email' | 'telefono', value: string): string => {
    if (!touched[field]) {
      return 'border-gray-300 focus:border-blue-500'
    }
    
    if (errors[field]) {
      return 'border-red-500 focus:border-red-500'
    }
    
    if (value.trim()) {
      return 'border-green-500 focus:border-green-500'
    }
    
    return 'border-gray-300 focus:border-blue-500'
  }

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1 transition-colors"
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
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Nombre completo */}
        <div>
          <label 
            htmlFor="nombre" 
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={() => handleBlur('nombre')}
              placeholder="Ej: Juan Pérez García"
              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 transition-colors ${getBorderClass('nombre', nombre)}`}
              style={{ 
                focusRingColor: errors.nombre ? '#ef4444' : touched.nombre && nombre ? '#10b981' : colorPrimario 
              }}
            />
            {/* Icono de estado */}
            {touched.nombre && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {errors.nombre ? (
                  <span className="text-red-500 text-xl">✕</span>
                ) : nombre.trim() ? (
                  <span className="text-green-500 text-xl">✓</span>
                ) : null}
              </div>
            )}
          </div>
          {/* Mensaje de error */}
          {touched.nombre && errors.nombre && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.nombre}
            </p>
          )}
          {/* Mensaje de éxito */}
          {touched.nombre && !errors.nombre && nombre.trim() && (
            <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
              <span>✓</span> Nombre válido
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Correo electrónico <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="Ej: juan.perez@email.com"
              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 transition-colors ${getBorderClass('email', email)}`}
            />
            {/* Icono de estado */}
            {touched.email && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {errors.email ? (
                  <span className="text-red-500 text-xl">✕</span>
                ) : email.trim() ? (
                  <span className="text-green-500 text-xl">✓</span>
                ) : null}
              </div>
            )}
          </div>
          {/* Mensaje de error */}
          {touched.email && errors.email && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.email}
            </p>
          )}
          {/* Mensaje de éxito */}
          {touched.email && !errors.email && email.trim() && (
            <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
              <span>✓</span> Email válido
            </p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label 
            htmlFor="telefono" 
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Teléfono celular <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              id="telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              onBlur={() => handleBlur('telefono')}
              placeholder="Ej: 4431234567"
              className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 transition-colors ${getBorderClass('telefono', telefono)}`}
              maxLength={10}
            />
            {/* Icono de estado */}
            {touched.telefono && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {errors.telefono ? (
                  <span className="text-red-500 text-xl">✕</span>
                ) : telefono.trim() ? (
                  <span className="text-green-500 text-xl">✓</span>
                ) : null}
              </div>
            )}
          </div>
          {/* Mensaje de error */}
          {touched.telefono && errors.telefono && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
              <span>⚠️</span> {errors.telefono}
            </p>
          )}
          {/* Mensaje de éxito */}
          {touched.telefono && !errors.telefono && telefono.trim() && (
            <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1">
              <span>✓</span> Teléfono válido
            </p>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            📱 Recibirás confirmación y recordatorios por SMS
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid()}
            className="flex-1 px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
            style={{ 
              backgroundColor: isFormValid() ? colorPrimario : '#9ca3af'
            }}
            title={!isFormValid() ? 'Completa todos los campos correctamente' : ''}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Procesando...
              </span>
            ) : (
              'Confirmar reserva'
            )}
          </button>
        </div>

        {/* Indicador de progreso */}
        {!isFormValid() && (touched.nombre || touched.email || touched.telefono) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-medium mb-1">
              ⚠️ Completa los siguientes campos:
            </p>
            <ul className="text-xs text-yellow-700 space-y-0.5 ml-4">
              {errors.nombre && <li>• {errors.nombre}</li>}
              {errors.email && <li>• {errors.email}</li>}
              {errors.telefono && <li>• {errors.telefono}</li>}
            </ul>
          </div>
        )}
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