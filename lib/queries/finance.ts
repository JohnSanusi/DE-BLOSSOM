import { createClient } from '@/lib/supabase/server'

export async function getMyTransactions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('transaction_date', { ascending: false })
  if (error) throw error
  return data
}

export async function getMyLoans() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase.from('loans').select('*, loan_payments(*)').eq('user_id', user.id).order('start_date', { ascending: false })
  if (error) throw error
  return data
}
