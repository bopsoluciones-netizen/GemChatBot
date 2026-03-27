import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    // 1. Check if the current user is a 'creator'
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (profile?.role !== 'creator') {
      return NextResponse.json({ error: "Forbidden: Only creators can create accounts" }, { status: 403 })
    }

    // 2. Parse request body
    const { name, slug, adminEmail, password } = await req.json()

    if (!name || !slug || !adminEmail || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 3. Create the Auth User
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: name, role: 'admin' }
    })

    if (authError) {
      console.error("Auth creation error:", authError.message)
      return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 400 })
    }

    // 4. Update or Create the Profile for the new user (handles triggers)
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert([{
        id: authData.user.id,
        email: adminEmail,
        full_name: name,
        role: "admin"
      }])

    if (profileError) {
      console.error("Profile creation error:", profileError.message)
      // Optional: Cleanup auth user if profile fails
      return NextResponse.json({ error: `Profile Error: ${profileError.message}` }, { status: 400 })
    }

    // 5. Create the Chatbot Account and link to the new Admin ID
    const { data: accountData, error: accountError } = await adminClient
      .from("chatbot_accounts")
      .insert([{
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        admin_email: adminEmail,
        admin_id: authData.user.id,
        creator_id: currentUser.id
      }])
      .select()
      .single()

    if (accountError) {
      console.error("Account creation error:", accountError.message)
      return NextResponse.json({ error: `Account Error: ${accountError.message}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, account: accountData })
  } catch (error: any) {
    console.error("Creator Account API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
