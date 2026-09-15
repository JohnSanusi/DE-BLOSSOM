import { createClient } from '@/lib/supabase/server'

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

export async function getMembers() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').order('member_number')
  if (error) throw error
  return data
}
