'use client'

import { useState, useEffect, useRef } from 'react'

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

type ReservaData = {
  nombre: string
  email: string
  telefono: string
  fecha: Date
  hora: string
  duracion: number
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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [reservaConfirmada, setReservaConfirmada] = useState<ReservaData | null>(null)
  const [submitProgress, setSubmitProgress] = useState(0)
  
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

  // Refs para auto-focus
  const nombreInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus en primer campo al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      nombreInputRef.current?.focus()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // Handler de teclado (Enter para submit, Escape para cancelar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onBack])

  // Función para formatear teléfono mexicano (XXX XXX XXXX)
  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '')
    const limited = numbers.slice(0, 10)
    
    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)} ${limited.slice(3)}`
    } else {
      return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`
    }
  }

  // Obtener solo números del teléfono (sin espacios)
  const getPhoneNumbers = (value: string): string => {
    return value.replace(/\D/g, '')
  }

  // Validar nombre
  const validateNombre = (value: string): string => {
    if (!value.trim()) {
      return 'El nombre es requerido'
    }
    if (value.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres'
    }
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
    const numbers = getPhoneNumbers(value)
    
    if (!numbers) {
      return 'El teléfono es requerido'
    }
    
    if (numbers.length !== 10) {
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

  // Handler especial para teléfono con formato
  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setTelefono(formatted)
  }

  // Handler para paste en teléfono
  const handleTelefonoPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const formatted = formatPhoneNumber(pastedText)
    setTelefono(formatted)
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
      // Shake animation en el primer campo con error
      return
    }

    setIsSubmitting(true)
    setSubmitProgress(0)
    
    // Obtener solo números del teléfono para guardar
    const telefonoLimpio = getPhoneNumbers(telefono)
    
    const reservaData: ReservaData = {
      nombre,
      email,
      telefono: telefonoLimpio,
      fecha: selectedDate,
      hora: selectedTime,
      duracion: duracionCita
    }
    
    console.log('📝 Datos del formulario:', reservaData)

    // Simular progress bar
    const progressInterval = setInterval(() => {
      setSubmitProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 150)

    // Simular proceso de guardado
    setTimeout(() => {
      clearInterval(progressInterval)
      setSubmitProgress(100)
      
      setTimeout(() => {
        setReservaConfirmada(reservaData)
        setShowConfirmation(true)
        setIsSubmitting(false)
        setSubmitProgress(0)
      }, 300)
    }, 1500)
  }

  // Handler para nueva reserva
  const handleNuevaReserva = () => {
    setNombre('')
    setEmail('')
    setTelefono('')
    setTouched({ nombre: false, email: false, telefono: false })
    setErrors({ nombre: '', email: '', telefono: '' })
    setShowConfirmation(false)
    setReservaConfirmada(null)
    onBack()
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

  // Si estamos en confirmación, mostrar pantalla de éxito
  if (showConfirmation && reservaConfirmada) {
    return (
      <div className="mt-6 animate-slideUp">
        <style jsx>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slideUp {
            animation: slideUp 0.4s ease-out;
          }
          @keyframes checkmark {
            0% {
              stroke-dashoffset: 50;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          .checkmark-path {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: checkmark 0.5s ease-in-out 0.3s forwards;
          }
        `}</style>

        {/* Animación de éxito */}
        <div className="bg-white rounded-xl shadow-lg border-2 p-8 md:p-12 text-center"
          style={{ borderColor: `${colorPrimario}40` }}
        >
          {/* Checkmark animado */}
          <div className="mb-6">
            <div 
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${colorPrimario}20` }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colorPrimario }}
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    className="checkmark-path"
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Título */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Reserva Confirmada!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Tu cita ha sido agendada exitosamente
          </p>

          {/* Resumen de la reserva */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Detalles de tu cita
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Lugar</p>
                  <p className="font-medium text-gray-900">{negocioNombre}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-900">
                    {reservaConfirmada.fecha.toLocaleDateString('es-MX', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">⏰</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Hora</p>
                  <p className="font-medium text-gray-900">
                    {formatTime(reservaConfirmada.hora)} ({reservaConfirmada.duracion} min)
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👤</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="font-medium text-gray-900">{reservaConfirmada.nombre}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📧</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 break-all">{reservaConfirmada.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl">📱</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">{formatPhoneNumber(reservaConfirmada.telefono)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📲 Recibirás un SMS de confirmación</strong> a tu teléfono con todos los detalles de tu cita.
            </p>
          </div>

          {/* Recordatorio */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-800">
              <strong>⏰ Recordatorio:</strong> Recibirás un mensaje 24 horas antes de tu cita. Si necesitas cancelar o reprogramar, responde al SMS.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button
              onClick={handleNuevaReserva}
              className="flex-1 px-6 py-3 border-2 rounded-lg font-medium transition-all hover:bg-gray-50 transform hover:scale-105 active:scale-95"
              style={{ 
                borderColor: colorPrimario,
                color: colorPrimario
              }}
            >
              📅 Agendar otra cita
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex-1 px-6 py-3 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: colorPrimario }}
            >
              ✓ Entendido
            </button>
          </div>

          {/* Nota final */}
          <p className="mt-8 text-xs text-gray-500">
            Reserva #TEMP-{Date.now().toString().slice(-6)} • {new Date().toLocaleTimeString('es-MX')}
          </p>
        </div>

        {/* Mensaje motivacional */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            ¡Gracias por confiar en nosotros! 🎉
          </p>
        </div>
      </div>
    )
  }

  // Formulario normal
  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 animate-fadeIn">
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s;
        }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1 transition-all hover:gap-2"
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
        className="mb-6 p-4 rounded-lg border-2 transition-all duration-300"
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
        <div className={touched.nombre && errors.nombre ? 'animate-shake' : ''}>
          <label 
            htmlFor="nombre" 
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                ref={nombreInputRef}
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onBlur={() => handleBlur('nombre')}
                placeholder="Ej: Juan Pérez García"
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 transition-all duration-200 ${getBorderClass('nombre', nombre)}`}
                style={{ 
                  focusRingColor: errors.nombre ? '#ef4444' : touched.nombre && nombre ? '#10b981' : colorPrimario 
                }}
              />
            </div>
            <div className="w-6 flex items-center justify-center">
              {touched.nombre && (
                <>
                  {errors.nombre ? (
                    <span className="text-red-500 text-xl animate-pulse">✕</span>
                  ) : nombre.trim() ? (
                    <span className="text-green-500 text-xl">✓</span>
                  ) : null}
                </>
              )}
            </div>
          </div>
          {touched.nombre && errors.nombre && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1 animate-slideDown">
              <span>⚠️</span> {errors.nombre}
            </p>
          )}
          {touched.nombre && !errors.nombre && nombre.trim() && (
            <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1 animate-slideDown">
              <span>✓</span> Nombre válido
            </p>
          )}
        </div>

        {/* Email */}
        <div className={touched.email && errors.email ? 'animate-shake' : ''}>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Correo electrónico <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="Ej: juan.perez@email.com"
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 transition-all duration-200 ${getBorderClass('email', email)}`}
              />
            </div>
            <div className="w-6 flex items-center justify-center">
              {touched.email && (
                <>
                  {errors.email ? (
                    <span className="text-red-500 text-xl animate-pulse">✕</span>
                  ) : email.trim() ? (
                    <span className="text-green-500 text-xl">✓</span>
                  ) : null}
                </>
              )}
            </div>
          </div>
          {touched.email && errors.email && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1 animate-slideDown">
              <span>⚠️</span> {errors.email}
            </p>
          )}
          {touched.email && !errors.email && email.trim() && (
            <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1 animate-slideDown">
              <span>✓</span> Email válido
            </p>
          )}
        </div>

        {/* Teléfono con máscara */}
        <div className={touched.telefono && errors.telefono ? 'animate-shake' : ''}>
          <label 
            htmlFor="telefono" 
            className="block text-sm font-medium text-gray-900 mb-1.5"
          >
            Teléfono celular <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="tel"
                id="telefono"
                value={telefono}
                onChange={handleTelefonoChange}
                onPaste={handleTelefonoPaste}
                onBlur={() => handleBlur('telefono')}
                placeholder="443 123 4567"
                className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 text-gray-900 transition-all duration-200 ${getBorderClass('telefono', telefono)}`}
                inputMode="numeric"
              />
            </div>
            <div className="w-6 flex items-center justify-center">
              {touched.telefono && (
                <>
                  {errors.telefono ? (
                    <span className="text-red-500 text-xl animate-pulse">✕</span>
                  ) : telefono.trim() ? (
                    <span className="text-green-500 text-xl">✓</span>
                  ) : null}
                </>
              )}
            </div>
          </div>
          {touched.telefono && errors.telefono && (
            <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1 animate-slideDown">
              <span>⚠️</span> {errors.telefono}
            </p>
          )}
          {touched.telefono && !errors.telefono && telefono.trim() && (
            <p className="mt-1.5 text-sm text-green-600 flex items-center gap-1 animate-slideDown">
              <span>✓</span> Teléfono válido
            </p>
          )}
          {!touched.telefono && (
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <span>📱</span> Formato: XXX XXX XXXX (10 dígitos)
            </p>
          )}
          {touched.telefono && !errors.telefono && telefono.trim() && (
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <span>📱</span> Recibirás confirmación y recordatorios por SMS a este número
            </p>
          )}
        </div>

        {/* Progress bar durante submit */}
        {isSubmitting && (
          <div className="animate-slideDown">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${submitProgress}%`,
                  backgroundColor: colorPrimario
                }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">
              Procesando tu reserva... {submitProgress}%
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid()}
            className={`flex-1 px-6 py-3 text-white rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md ${
              isFormValid() && !isSubmitting ? 'hover:shadow-lg transform hover:scale-105 active:scale-95 animate-pulse' : ''
            }`}
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
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-slideDown">
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

        {/* Hint de teclado */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Presiona <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd> para confirmar o <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> para cancelar
          </p>
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