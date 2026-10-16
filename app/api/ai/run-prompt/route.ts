// Retired: the admin prompt dashboard now uses the user's existing ChatGPT plan in a separate tab.
// Keep a clear response for stale clients instead of making an AI API call.
export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json(
    { error: 'This endpoint is retired. Copy the prompt and open ChatGPT using your existing plan.' },
    { status: 410 },
  )
}
