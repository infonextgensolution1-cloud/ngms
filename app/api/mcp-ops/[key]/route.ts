import { timingSafeEqual } from 'crypto'
import { SERVER_INFO, SUPPORTED_PROTOCOLS, ToolError, db, type Args, type ToolResult } from '@/lib/ngms-ops/core'
import { TOOLS } from '@/lib/ngms-ops/tools'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { handlersB } from '@/lib/ngms-ops/handlers-b'

/**
 * NGSMS Ops MCP server — quotes, invoices, jobs & job costing.
 * Tool logic lives in lib/ngms-ops/ (core.ts has the setup notes and money rules).
 * Connector URL: https://www.nextgensolarmaintenance.co.za/api/mcp-ops/<MCP_ACCESS_KEY>
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const handlers = { ...handlersA, ...handlersB }

async function callTool(name: string, args: Args): Promise<ToolResult> {
  const h = handlers[name]
  if (!h) throw new ToolError(`Unknown tool '${name}'. Available: ${TOOLS.map((t) => t.name).join(', ')}`)
  return h(db(), args)
}

// ================================================================ JSON-RPC / MCP plumbing

type RpcMessage = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> }

function rpcResult(id: RpcMessage['id'], result: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, result }
}
function rpcError(id: RpcMessage['id'], code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

async function handleMessage(msg: RpcMessage) {
  const isNotification = msg.id === undefined
  if (msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return isNotification ? null : rpcError(msg.id, -32600, 'Invalid JSON-RPC request')
  if (isNotification) return null

  switch (msg.method) {
    case 'initialize': {
      const requested = String(msg.params?.protocolVersion ?? '')
      return rpcResult(msg.id, {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Quotes, invoices, jobs and job costing for NextGen Solar Clean & Maintenance Solutions (Helderberg + Overberg). ' +
          'Flow: lead (NGSMS Leads connector) → ngms_create_quote (lead_id) → ngms_update_quote status sent/accepted → ngms_create_invoice kind deposit → ngms_create_job → log labour/costs → ngms_update_job completed → ngms_create_invoice kind balance → ngms_record_payment. ' +
          'Start with ngms_business_summary for the big picture. Prices are ZAR excluding VAT (not VAT registered); default 70% deposit / 30% on completion; R350 callout outside the Helderberg Basin. Dates are SAST. ' +
          'Before putting banking details on any client document, confirm the Capitec account number with the owner.',
      })
    }
    case 'ping':
      return rpcResult(msg.id, {})
    case 'tools/list':
      return rpcResult(msg.id, { tools: TOOLS })
    case 'tools/call': {
      const name = String(msg.params?.name ?? '')
      const args = (msg.params?.arguments ?? {}) as Args
      if (typeof args !== 'object' || args === null || Array.isArray(args)) return rpcError(msg.id, -32602, 'arguments must be an object')
      if (!TOOLS.some((t) => t.name === name)) return rpcError(msg.id, -32602, `Unknown tool: ${name}`)
      try {
        return rpcResult(msg.id, await callTool(name, args))
      } catch (err) {
        const text = err instanceof ToolError ? err.message : `Unexpected error: ${(err as Error)?.message ?? err}`
        if (!(err instanceof ToolError)) console.error('[mcp-ops] tool error', name, err)
        return rpcResult(msg.id, { content: [{ type: 'text', text }], isError: true })
      }
    }
    case 'resources/list':
      return rpcResult(msg.id, { resources: [] })
    case 'prompts/list':
      return rpcResult(msg.id, { prompts: [] })
    default:
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`)
  }
}

function authorised(key: string, request: Request): boolean {
  const expected = process.env.MCP_OPS_ACCESS_KEY || process.env.MCP_ACCESS_KEY
  if (!expected || expected.length < 24) return false
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const given = Buffer.from(bearer || key || '')
  const want = Buffer.from(expected)
  return given.length === want.length && timingSafeEqual(given, want)
}

function json(body: unknown, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}

export async function POST(request: Request, { params }: { params: { key: string } }) {
  if (!authorised(params.key, request)) return json({ error: 'Not found' }, 404)
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json(rpcError(null, -32700, 'Parse error'), 400)
  }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleMessage(m as RpcMessage)))).filter(Boolean)
    return out.length ? json(out) : new Response(null, { status: 202 })
  }
  const out = await handleMessage(body as RpcMessage)
  return out ? json(out) : new Response(null, { status: 202 })
}

export async function GET() {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } })
}
export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } })
}
