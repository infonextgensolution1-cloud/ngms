import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH_VERSION = process.env.WHATSAPP_API_VERSION || "v24.0";

type IncomingMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signature.slice(7);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function sendWhatsApp(to: string, text: string, buttons?: Array<{ id: string; title: string }>) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { configured: false };

  const interactive = buttons?.length
    ? {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.slice(0, 3).map((button) => ({
            type: "reply",
            reply: button,
          })),
        },
      }
    : undefined;

  const body = interactive
    ? { messaging_product: "whatsapp", to, type: "interactive", interactive }
    : { messaging_product: "whatsapp", to, type: "text", text: { body: text } };

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`WhatsApp API ${response.status}: ${detail.slice(0, 500)}`);
  }

  return { configured: true };
}

async function ensureLead(from: string, message: string) {
  try {
    const db = supabaseAdmin();
    const tail = from.replace(/\\D/g, "").slice(-9);
    const { data: existing } = await db
      .from("leads")
      .select("id")
      .ilike("phone", `%${tail}`)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      await db.from("leads").insert({
        name: "WhatsApp enquiry",
        phone: from,
        service: "WhatsApp enquiry",
        source: "whatsapp",
        status: "new",
        message: message.slice(0, 4000),
      });
    }
  } catch (error) {
    console.error("WhatsApp lead logging failed:", error);
  }
}

function replyFor(message: IncomingMessage) {
  const text = message.text?.body?.trim() || "";
  const buttonId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id || "";

  if (buttonId === "quote") {
    return {
      text: "Absolutely. Send us a photo of the job, your suburb and a short description. We can then prepare the next step.",
      buttons: [
        { id: "photo", title: "Send a photo" },
        { id: "call", title: "Call NextGen" },
      ],
    };
  }

  if (buttonId === "photo") {
    return { text: "Please send the photo here with your suburb and, if relevant, the panel count or approximate job size." };
  }

  if (buttonId === "call") {
    return { text: "You can call NextGen on 063 138 7945 during business hours, Mon–Sat 07:00–18:00." };
  }

  return {
    text:
      "Thanks for contacting NextGen Maintenance Solutions. 👋 We cover solar cleaning, painting, waterproofing, paving, plumbing, electrical and more across the Helderberg.",
    buttons: [
      { id: "quote", title: "Get a quote" },
      { id: "photo", title: "Send a photo" },
      { id: "call", title: "Call NextGen" },
    ],
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entries = Array.isArray(payload?.entry) ? payload.entry : [];

  for (const entry of entries) {
    for (const change of entry?.changes || []) {
      const value = change?.value;
      const messages = Array.isArray(value?.messages) ? value.messages : [];

      for (const message of messages as IncomingMessage[]) {
        if (!message.from) continue;

        const incomingText =
          message.text?.body ||
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          `WhatsApp message (${message.type || "unknown"})`;

        await ensureLead(message.from, incomingText);

        const reply = replyFor(message);
        try {
          await sendWhatsApp(message.from, reply.text, reply.buttons);
        } catch (error) {
          console.error("WhatsApp auto-reply failed:", error);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
