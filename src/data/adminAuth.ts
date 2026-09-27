import { requireSupabase } from './supabase'

export async function signInAdmin(email: string, password: string) {
  const client = requireSupabase()
  const { error: signInError } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (signInError) throw new Error('Email or password is incorrect.')

  const { data: isAdmin, error: roleError } = await client.rpc('is_admin')
  if (roleError) {
    await client.auth.signOut()
    throw new Error('Could not verify admin access. Check that the Supabase setup SQL has been run.')
  }
  if (isAdmin !== true) {
    await client.auth.signOut()
    throw new Error('This account does not have admin access yet.')
  }
}

export async function isAdminUnlocked() {
  const client = requireSupabase()
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError || !sessionData.session) return false

  const { data: isAdmin, error } = await client.rpc('is_admin')
  return !error && isAdmin === true
}

export async function lockAdmin() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}
