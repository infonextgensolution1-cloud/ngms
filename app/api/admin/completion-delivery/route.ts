import { NextResponse } from 'next/server'
import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendCustomerCompletionEmail } from '@/lib/lead-email'
import { isEmail } from '@/lib/rate-limit'
import { SITE } from '@/lib/site'

export const dynamic='force-dynamic'
export const runtime='nodejs'

export async function POST(request:Request){
  const token=request.headers.get('authorization')?.replace(/^Bearer\s+/i,'').trim()
  if(!token) return NextResponse.json({error:'Sign in to /admin first.'},{status:401})
  let db
  try{db=supabaseAdmin()}catch{return NextResponse.json({error:'Server is not configured for delivery.'},{status:500})}
  const {data:auth,error:authError}=await db.auth.getUser(token)
  if(authError||!auth.user) return NextResponse.json({error:'Your session has expired. Sign in again.'},{status:401})
  if(jwtAal(token)!=='aal2') return NextResponse.json({error:MFA_REQUIRED_MESSAGE},{status:403})
  const {data:staff}=await db.from('prompt_users').select('user_id').eq('user_id',auth.user.id).eq('active',true).maybeSingle()
  if(!staff) return NextResponse.json({error:'Staff only.'},{status:403})
  const body=(await request.json().catch(()=>({}))) as {jobId?:unknown;channel?:unknown;mode?:unknown}
  const jobId=typeof body.jobId==='string'?body.jobId:''
  const channel=body.channel==='email'?'email':body.channel==='whatsapp'?'whatsapp':'both'
  const mode=body.mode==='final'?'final':'completion'
  if(!/^[0-9a-f-]{36}$/i.test(jobId)) return NextResponse.json({error:'Missing job.'},{status:400})
  const {data:job}=await db.from('jobs').select('id,title,completed_date,client_id,quote_id').eq('id',jobId).maybeSingle()
  if(!job) return NextResponse.json({error:'Job not found.'},{status:404})
  const {data:client}=await db.from('clients').select('id,name,email,phone').eq('id',job.client_id).maybeSingle()
  if(!client) return NextResponse.json({error:'Client not found.'},{status:404})
  const {data:settings}=await db.from('settings').select('business_name,google_review_url,facebook_review_url').eq('id',1).maybeSingle()
  const {data:invoice}=job.quote_id
    ? await db.from('invoices').select('id,invoice_number,total_amount,paid_amount,status,notes').eq('quote_id',job.quote_id).neq('status','void').order('created_at',{ascending:false}).limit(10).then(r=>({data:(r.data??[]).find(i=>/balance/i.test(String(i.notes??'')))??null}))
    : {data:null}
  const balance=invoice?Math.max(0,Number(invoice.total_amount)-Number(invoice.paid_amount)):0
  if(mode==='final'){
    if(!invoice) return NextResponse.json({error:'No final balance invoice exists for this job. Create the balance invoice first.'},{status:409})
    if(balance<=0.004) return NextResponse.json({error:'No outstanding final balance remains.'},{status:409})
    const notes=String(invoice.notes??'')
    const marker=channel==='email'?'FINAL PAYMENT EMAIL SENT':'FINAL PAYMENT WHATSAPP PREPARED'
    if(notes.includes(marker)) return NextResponse.json({error:`A final payment request was already ${channel==='email'?'emailed':'prepared for WhatsApp'} for ${invoice.invoice_number}.`},{status:409})
  }
  const first=String(client.name).trim().split(/\\s+/)[0]||'there'
  const portal=`${SITE.url}/portal`
  const lines=[
    `Hi ${first},`,
    '',
    `Thank you for choosing ${settings?.business_name||'NextGen Maintenance Solutions'}.`,
    `Your job “${job.title||'Maintenance service'}” was completed${job.completed_date?` on ${job.completed_date}`:''}.`,
    '',
    'Your completion report, job photos and account information are available in your NextGen Customer Portal:',
    portal,
    balance>0?`Outstanding final balance: R ${balance.toFixed(2)}`:'Your account shows no outstanding balance.',
    '',
    settings?.google_review_url?`Google review: ${settings.google_review_url}`:null,
    settings?.facebook_review_url?`Facebook review: ${settings.facebook_review_url}`:null,
    '',
    'If you know someone who could use our services, we would really appreciate a referral.',
    '',
    'ONE CALL. ALL SOLUTIONS.'
  ].filter((x):x is string=>Boolean(x))
  if((channel==='email'||channel==='both')&&isEmail(client.email)){
    try{
      await sendCustomerCompletionEmail({
        to:client.email!, name:client.name, jobTitle:job.title||'Maintenance service',
        completedDate:job.completed_date, portalLink:portal, balance,
        googleReviewUrl:settings?.google_review_url, facebookReviewUrl:settings?.facebook_review_url
      })
    }catch(err){console.error('completion delivery email failed',err);return NextResponse.json({error:'Could not send the completion email.'},{status:502})}
  }else if(channel==='email') return NextResponse.json({error:'Client has no valid email address.'},{status:400})
  if(mode==='final'){
    const marker=channel==='email'?'FINAL PAYMENT EMAIL SENT':channel==='whatsapp'?'FINAL PAYMENT WHATSAPP PREPARED':'FINAL PAYMENT EMAIL SENT'
    const timestamp=new Date().toISOString()
    const nextNotes=`${String(invoice?.notes??'')}\\n[${marker} ${timestamp}]`.trim()
    if(invoice){
      const {error:noteError}=await db.from('invoices').update({notes:nextNotes}).eq('id',invoice.id)
      if(noteError) return NextResponse.json({error:'Payment request was delivered but could not be recorded.'},{status:500})
      if(channel==='both'){
        const {error:waError}=await db.from('invoices').update({notes:`${nextNotes}\\n[FINAL PAYMENT WHATSAPP PREPARED ${timestamp}]`}).eq('id',invoice.id)
        if(waError) console.error('could not record WhatsApp preparation',waError)
      }
    }
  }
  return NextResponse.json({ok:true,channel,mode,sentTo:channel==='whatsapp'?client.phone:client.email,whatsappText:lines.join('\\n'),balance,invoiceNumber:invoice?.invoice_number??null})
}
