/**
 * Debug utilities for authentication state management
 * Use these in development when auth state gets stuck
 */

export function clearAllAuthState() {
  if (typeof window === 'undefined') return
  
  console.log('🧹 Clearing all authentication state...')
  
  // Clear all localStorage keys related to Supabase
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth') ||
        key.includes('session')) {
      console.log(`Removing localStorage key: ${key}`)
      localStorage.removeItem(key)
    }
  })
  
  // Clear all sessionStorage keys related to Supabase
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth') ||
        key.includes('session')) {
      console.log(`Removing sessionStorage key: ${key}`)
      sessionStorage.removeItem(key)
    }
  })
  
  // Clear all cookies by setting them to expire
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
    if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      console.log(`Cleared cookie: ${name}`)
    }
  })
  
  console.log('✅ All authentication state cleared!')
  console.log('🔄 Please refresh the page to see login button')
  
  // Force page reload to reset state
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}

export function debugAuthState() {
  if (typeof window === 'undefined') return
  
  console.log('🔍 Current Authentication State:')
  
  // Check localStorage
  const lsKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
  )
  console.log('📦 localStorage keys:', lsKeys.length > 0 ? lsKeys : 'None')
  
  // Check sessionStorage  
  const ssKeys = Object.keys(sessionStorage).filter(key => 
    key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
  )
  console.log('📝 sessionStorage keys:', ssKeys.length > 0 ? ssKeys : 'None')
  
  // Check cookies
  const authCookies = document.cookie.split(";").filter(cookie => {
    const name = cookie.split("=")[0].trim()
    return name.includes('supabase') || name.includes('sb-') || name.includes('auth')
  })
  console.log('🍪 Auth cookies:', authCookies.length > 0 ? authCookies : 'None')
  
  // Show instructions
  console.log('🛠️  To clear all auth state, run: clearAllAuthState()')
}

// Make functions available on window for debugging
if (typeof window !== 'undefined') {
  ;(window as any).clearAllAuthState = clearAllAuthState
  ;(window as any).debugAuthState = debugAuthState
  
  console.log('🔧 Auth debug utilities loaded!')
  console.log('   Use clearAllAuthState() to clear all auth state')
  console.log('   Use debugAuthState() to inspect current state')
}
