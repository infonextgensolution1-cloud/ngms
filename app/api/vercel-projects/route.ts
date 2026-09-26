import { NextRequest, NextResponse } from 'next/server'
import { listProjects } from '@/lib/vercel-client'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

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

    if (message.includes('VERCEL_API_TOKEN')) {
      return NextResponse.json(
        { error: 'Vercel API token not configured' },
        { status: 500 }
      )
    }

    if (message.includes('Invalid') || message.includes('401')) {
      return NextResponse.json(
        { error: 'Invalid Vercel API token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
