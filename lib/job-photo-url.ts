import { supabase } from '@/lib/supabaseClient'
import { jobPhotoStoragePath } from '@/lib/job-photo-path'

export async function signedJobPhotoUrl(value: string): Promise<string | null> {
  const path = jobPhotoStoragePath(value)
  if (!path) return null
  const { data, error } = await supabase.storage.from('job-photos').createSignedUrl(path, 300)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
