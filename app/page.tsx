'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Card from '@/components/Card'

/**
 * Interfaz para datos de negocio
 */
interface Business {
  id: string
  nombre_negocio: string
  subdominio: string
  industry: string
  color_primario: string
}

/**
 * Página principal - Homepage
 * Muestra features del producto + negocios registrados
 */
export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch de negocios al cargar
  useEffect(() => {
    async function fetchBusinesses() {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre_negocio, subdominio, industry, color_primario')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching businesses:', error)
      } else {
        setBusinesses(data || [])
      }
      setLoading(false)
    }

    fetchBusinesses()
  }, [])
  // ... resto del código igual