import { NextResponse } from "next/server";
import { readMediaBytes } from "@/lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = {params:Promise<{id:string}>};

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
        "Content-Disposition":`inline; filename="${media.filename.replace(/["\\\\]/g,"_")}"`,
      },
    });
  } catch {
    return NextResponse.json({error:"Media could not be read."},{status:404});
  }
}
