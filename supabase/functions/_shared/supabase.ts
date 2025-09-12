// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

export function createSupabaseClient(req: Request) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { 
      global: { 
        headers: { 
          Authorization: req.headers.get('Authorization')! 
        } 
      } 
    }
  )
}

export async function getAuthenticatedUser(supabaseClient: any) {
  const { data: { user }, error } = await supabaseClient.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  return user
}
