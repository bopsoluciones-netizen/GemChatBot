import { createClient } from './server'

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function isAdmin() {
  const profile = await getProfile()
  return profile?.role === 'admin'
}

export async function isCreator() {
  const profile = await getProfile()
  return profile?.role === 'creator'
}
