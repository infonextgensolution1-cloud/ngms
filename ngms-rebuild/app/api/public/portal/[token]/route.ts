import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {row,rows} from "@/lib/server/db";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{token:string}>};

export async function GET(_request:Request,context:Context){
 try{
  const {token}=await context.params;
  if(!/^[a-f0-9]{64}$/i.test(token))return NextResponse.json({error:"This customer portal link is invalid."},{status:404});
  const hash=createHash("sha256").update(token).digest("hex");
  const link=await row(
   "SELECT l.customer_id,l.expires_at,l.revoked_at,c.display_name FROM customer_portal_links l JOIN customers c ON c.id=l.customer_id WHERE l.token_hash=? LIMIT 1",
   [hash],
  );
  if(!link||link.revoked_at||new Date(String(link.expires_at)+"Z").getTime()<=Date.now()){
   return NextResponse.json({error:"This customer portal link is invalid or has expired. Contact NGMS for a new link."},{status:404});
  }
  const customerId=String(link.customer_id);
  const [documents,jobs,maintenance]=await Promise.all([
   rows("SELECT reference,kind,amount_cents,status,issue_date,due_date,created_at FROM documents WHERE customer_id=? ORDER BY created_at DESC LIMIT 50",[customerId]),
   rows("SELECT reference,service,area,status,scheduled_start,scheduled_end,created_at FROM jobs WHERE customer_id=? ORDER BY created_at DESC LIMIT 50",[customerId]),
   rows("SELECT service,property_area,frequency,next_due_date,amount_cents,status FROM maintenance_plans WHERE customer_id=? ORDER BY next_due_date LIMIT 50",[customerId]),
  ]);
  return NextResponse.json({
   customer:{display_name:String(link.display_name)},
   expires_at:new Date(String(link.expires_at)+"Z").toISOString(),
   documents:documents.map(item=>({...item,amount_cents:Number(item.amount_cents)})),
   jobs,
   maintenance:maintenance.map(item=>({...item,amount_cents:Number(item.amount_cents)})),
  },{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Referrer-Policy":"no-referrer"}});
 }catch{
  return NextResponse.json({error:"The customer portal could not be loaded."},{status:404});
 }
}
