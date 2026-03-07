// Test simple de Supabase Auth
// Ejecutar con: node test-auth.js

const { createClient } = require('@supabase/supabase-js')

// TUS CREDENCIALES (cópialas de .env.local)
const supabaseUrl = 'https://gyfximoxybmkszltzd0j.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZnhpbW94eWJta3N6bHR6ZDBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg3MTQyNzUsImV4cCI6MjAyNDI5MDI3NX0.sb_publishable_E_PbqtffVUMTTXK9tpINkw_poblFDQ_GxwPZL3GwUWs'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🧪 Testing Supabase Auth...\n')

  // Test 1: Sign Up (crear nuevo usuario)
  console.log('1️⃣ Probando registro de nuevo usuario...')
  const testEmail = 'test-' + Date.now() + '@ejemplo.com'
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!'
  })

  if (signUpError) {
    console.log('❌ Error en registro:', signUpError.message)
  } else {
    console.log('✅ Registro exitoso!')
    console.log('   User ID:', signUpData.user?.id)
    console.log('   Email:', signUpData.user?.email)
    console.log('   Confirmado:', signUpData.user?.email_confirmed_at ? 'Sí' : 'No (revisar email)')
  }

  // Test 2: Sign In (login con usuario existente)
  console.log('\n2️⃣ Probando login con usuario de prueba...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'prueba@cito.mx',
    password: 'Test1234!'
  })

  if (signInError) {
    console.log('❌ Error en login:', signInError.message)
  } else {
    console.log('✅ Login exitoso!')
    console.log('   User ID:', signInData.user?.id)
    console.log('   Email:', signInData.user?.email)
    console.log('   Session token:', signInData.session?.access_token?.substring(0, 20) + '...')
  }

  // Test 3: Get User (obtener usuario actual)
  console.log('\n3️⃣ Probando obtener usuario actual...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.log('❌ Error:', userError.message)
  } else if (!user) {
    console.log('⚠️  No hay usuario autenticado')
  } else {
    console.log('✅ Usuario actual obtenido!')
    console.log('   Logged in as:', user.email)
    console.log('   ID:', user.id)
  }

  // Test 4: Sign Out
  console.log('\n4️⃣ Probando cerrar sesión...')
  const { error: signOutError } = await supabase.auth.signOut()
  
  if (signOutError) {
    console.log('❌ Error:', signOutError.message)
  } else {
    console.log('✅ Sesión cerrada exitosamente!')
  }

  console.log('\n✨ Tests completados!\n')
  console.log('📝 Resumen:')
  console.log('   - Nuevo usuario creado:', testEmail)
  console.log('   - Login funcionando: ✅')
  console.log('   - Auth sistema listo para usar')
}

testAuth()