import { NextRequest, NextResponse } from 'next/server'
import { listProjects } from '@/lib/vercel-client'
import { supabase } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  'VERCEL_API_TOKEN': { message: 'Vercel API token not configured', status: 500 },
  'Invalid': { message: 'Invalid Vercel API token', status: 401 },
  '401': { message: 'Invalid Vercel API token', status: 401 },
}

export async function GET(request: NextRequest) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await listProjects()

    return NextResponse.json({ projects })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch projects'
    const errorConfig = Object.entries(ERROR_MAP).find(([key]) => message.includes(key))?.[1]

    return NextResponse.json(
      { error: errorConfig?.message || message },
      { status: errorConfig?.status || 500 }
    )
  }
}
