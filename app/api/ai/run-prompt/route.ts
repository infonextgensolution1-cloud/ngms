import { ask, errorResponse, HttpError, requireStaff } from '@/lib/ai/claude'

// Runs a finished prompt from the admin Prompt Dashboard and returns Claude's answer.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_PROMPT_CHARS = 40_000

export async function POST(request: Request) {
  try {
    await requireStaff(request)
    const body = (await request.json().catch(() => ({}))) as { prompt?: unknown }
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    if (!prompt) throw new HttpError(400, 'The prompt is empty.')
    if (prompt.length > MAX_PROMPT_CHARS) throw new HttpError(400, 'That prompt is too long to run here. Use Open in Claude.')

    const text = await ask({ prompt })
    return Response.json({ text })
  } catch (e) {
    return errorResponse(e)
  }
}
