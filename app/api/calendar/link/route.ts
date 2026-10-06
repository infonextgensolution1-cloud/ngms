import { NextResponse } from 'next/server'
import { errorResponse, requireStaff } from '@/lib/ai/openai'
import { feedUrl } from '@/lib/calendar-feed'

// Hands the private calendar feed URL to a signed-in staff member only.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireStaff(request)
    const url = feedUrl()
    if (!url) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is missing in Vercel env vars, so the calendar feed is off.' }, { status: 503 })
    return NextResponse.json({ url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return errorResponse(e)
  }
}
