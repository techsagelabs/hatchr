import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Check if user_profiles table exists and what columns it has
    const debugInfo: any = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      database: {
        tableExists: false,
        hasUsernameColumn: false,
        profileExists: false,
        columns: []
      }
    }

    try {
      // Check if we can query the table at all
      const { data: profiles, error: tableError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)

      if (tableError) {
        debugInfo.database.tableError = {
          message: tableError.message,
          code: tableError.code,
          details: tableError.details
        }
      } else {
        debugInfo.database.tableExists = true
        
        // If we got data, check what columns exist
        if (profiles && profiles.length > 0) {
          debugInfo.database.columns = Object.keys(profiles[0])
          debugInfo.database.hasUsernameColumn = 'username' in profiles[0]
        }
      }

      // Check if current user has a profile
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileError) {
          debugInfo.database.profileError = {
            message: profileError.message,
            code: profileError.code
          }
        } else {
          debugInfo.database.profileExists = true
          debugInfo.database.currentProfile = userProfile
          if (userProfile) {
            debugInfo.database.columns = Object.keys(userProfile)
            debugInfo.database.hasUsernameColumn = 'username' in userProfile
          }
        }
      } catch (e: any) {
        debugInfo.database.profileCheckError = e.message
      }

    } catch (e: any) {
      debugInfo.database.generalError = e.message
    }

    // Check if username column exists by trying to select it
    try {
      const { error: usernameColumnError } = await supabase
        .from('user_profiles')
        .select('username')
        .limit(1)

      if (usernameColumnError) {
        if (usernameColumnError.message?.includes('column "username" does not exist')) {
          debugInfo.database.usernameColumnStatus = 'does_not_exist'
          debugInfo.database.migrationNeeded = true
        } else {
          debugInfo.database.usernameColumnStatus = 'error_checking'
          debugInfo.database.usernameColumnError = usernameColumnError.message
        }
      } else {
        debugInfo.database.usernameColumnStatus = 'exists'
        debugInfo.database.migrationNeeded = false
      }
    } catch (e: any) {
      debugInfo.database.usernameColumnCheckError = e.message
    }

    return NextResponse.json(debugInfo)

  } catch (error: any) {
    console.error('Error in profile debug endpoint:', error)
    return NextResponse.json({ 
      error: "Debug endpoint error", 
      message: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
