/**
 * Cliente de Supabase para Cito.mx
 * 
 * Este cliente se usa en toda la aplicación para:
 * - Queries a la base de datos
 * - Autenticación de usuarios
 * - Upload de archivos (logos)
 * - Realtime subscriptions (futuro)
 */

import { createClient } from '@supabase/supabase-js'

// Variables de entorno validadas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente singleton exportado
export const supabase = createClient(supabaseUrl, supabaseAnonKey)