import { NextResponse } from "next/server";
import { readMediaBytes } from "@/lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = {params:Promise<{id:string}>};

function safeHeaderFilename(value: unknown): string {
  return String(value ?? "image").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "image";
}

export async function GET(_request:Request,context:Context) {
  try {
    const {id}=await context.params;
    const media=await readMediaBytes(id,true);
    if(!media) return NextResponse.json({error:"Published image not found."},{status:404});
    return new NextResponse(new Uint8Array(media.bytes),{
      status:200,
      headers:{
        "Content-Type":media.type,
        "Content-Length":String(media.bytes.length),
        "Cache-Control":"public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options":"nosniff",
        "Content-Disposition":`inline; filename="${safeHeaderFilename(media.filename)}"`,
      },
    });
  } catch {
    return NextResponse.json({error:"Media could not be read."},{status:404});
  }
}
