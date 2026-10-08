'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Image as ImageIcon, Loader2, MessageCircle, Printer } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { handlersC } from '@/lib/ngms-ops/handlers-c'
import { LOGO_DATA_URI } from '@/lib/logo'

type Job = { id:string; title:string|null; description:string|null; status:string; scheduled_date:string|null; completed_date:string|null; quote_id:string|null }
type Client = { name:string; phone:string|null; email:string|null; address:string|null; suburb:string|null }
type Photo = { id:string; photo_url:string; type:string; caption:string|null }
type Settings = { google_review_url:string|null; facebook_review_url:string|null }
type Balance = { id:string; invoice_number:string; total_amount:number; paid_amount:number; status:string }

const brand={black:'#0A0A0A',purple:'#8B1BF5',grey:'#5B5B5B',line:'#E4E4E4'}

function CompletionView(){
  const params=useParams<{id:string}>()
  const [job,setJob]=useState<Job|null>(null)
  const [client,setClient]=useState<Client|null>(null)
  const [photos,setPhotos]=useState<Photo[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [settings,setSettings]=useState<Settings>({google_review_url:null,facebook_review_url:null})
  const [balance,setBalance]=useState<Balance|null>(null)
  const [reviewRequested,setReviewRequested]=useState(false)
  const [action,setAction]=useState<string|null>(null)

  const load=useCallback(async()=>{
    setLoading(true); setError('')
    try{
      const [jr,pr,sr]=await Promise.all([
        handlersB.ngms_get_job(supabase,{job_id:params.id}),
        handlersC.ngms_list_job_photos(supabase,{job_id:params.id}),
        supabase.from('settings').select('google_review_url,facebook_review_url').eq('id',1).maybeSingle()
      ])
      if(jr.isError) throw new Error(jr.content[0]?.text??'Could not load job')
      const sc=jr.structuredContent as {job:Job;client:Client|null}
      setJob(sc.job); setClient(sc.client); setPhotos((pr.structuredContent?.photos as Photo[])??[])
      setSettings((sr.data as Settings|null) ?? {google_review_url:null,facebook_review_url:null})
      if(sc.job.quote_id){
        const {data:invoices}=await supabase.from('invoices').select('id,invoice_number,total_amount,paid_amount,status,notes').eq('quote_id',sc.job.quote_id).neq('status','void').order('created_at',{ascending:false})
        const b=(invoices??[]).find((i:any)=>/balance/i.test(String(i.notes??'')))
        setBalance((b as Balance|null)??null)
      }
      if(sc.job.client_id){
        const {data:rr}=await supabase.from('review_requests').select('id').eq('job_id',sc.job.id).neq('status','closed').limit(1).maybeSingle()
        setReviewRequested(!!rr)
      }
    }catch(e){setError((e as Error).message)}
    finally{setLoading(false)}
  },[params.id])

  useEffect(()=>{void load()},[load])

  const grouped=useMemo(()=>{
    const g:{before:Photo[];progress:Photo[];after:Photo[]}={before:[],progress:[],after:[]}
    photos.forEach(p=>{if(p.type in g) g[p.type as keyof typeof g].push(p)})
    return g
  },[photos])

  async function requestReview(){
    if(!job||!client) return
    setAction('review')
    setError('')
    try{
      const {data:clientRow}=await supabase.from('clients').select('id').eq('name',client.name).eq('phone',client.phone).limit(1).maybeSingle()
      const {error:e}=await supabase.from('review_requests').insert({
        client_id:clientRow?.id ?? undefined,
        job_id:job.id,
        google_review_url:settings.google_review_url,
        facebook_review_url:settings.facebook_review_url,
        status:'requested'
      })
      if(e) throw e
      setReviewRequested(true)
    }catch(e){setError((e as Error).message)}
    finally{setAction(null)}
  }

  function whatsapp(){
    if(!client?.phone||!job) return
    const digits=client.phone.replace(/\D/g,'').replace(/^0/,'27')
    const text=[
      `Hi ${client.name}, your NGMS job is complete.`,
      `Job: ${job.title??'Maintenance work'}`,
      job.completed_date?`Completed: ${job.completed_date}`:null,
      'We have prepared your completion report with the site photos.',
      'Thank you for choosing NextGen Maintenance Solutions.'
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`,'_blank','noopener,noreferrer')
  }

  if(loading) return <main className="min-h-screen bg-jet flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-mist"/></main>
  if(error||!job) return <main className="min-h-screen bg-jet px-4 py-16 text-center text-orange">{error||'Job not found'}</main>

  return <main className="min-h-screen bg-jet px-4 py-8">
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-5 flex items-center justify-between gap-3">
        <Link href={`/admin/jobs/${job.id}`} className="inline-flex items-center gap-1 text-sm text-mist hover:text-paper"><ArrowLeft className="h-4 w-4"/> Job</Link>
        <div className="flex gap-2">
          {client?.phone&&<button onClick={whatsapp} className="inline-flex items-center gap-2 rounded-btn bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4"/> WhatsApp</button>}
          <button onClick={()=>window.print()} className="inline-flex items-center gap-2 rounded-btn border border-darkgrey px-3 py-2 text-sm text-mist hover:border-blue hover:text-paper"><Printer className="h-4 w-4"/> Print / PDF</button>
        </div>
      </div>

      <div id="completion-report" className="rounded-card bg-white p-6 shadow-xl sm:p-8" style={{color:brand.black,fontFamily:'Inter,system-ui,sans-serif'}}>
        <div className="flex items-start justify-between gap-4 border-b-[3px] pb-4" style={{borderColor:brand.purple}}>
          <img src={LOGO_DATA_URI} alt="NGMS logo" style={{height:48,width:'auto'}}/>
          <div className="text-right text-xs" style={{color:brand.grey}}>
            <p className="text-[15px] font-bold" style={{color:brand.black}}>NextGen Solar Clean &amp; Maintenance Solutions</p>
            <p>Job Completion Report</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl p-4 text-sm" style={{background:'#F7F5FA'}}>
          <div className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5" style={{color:'#39D353'}}/> Job completed</div>
          <p className="mt-2 font-bold">{job.title??'Maintenance job'}</p>
          <p style={{color:brand.grey}}>{client?.name??'Client'}{client?.suburb?`, ${client.suburb}`:''}</p>
          <p style={{color:brand.grey}}>Scheduled: {job.scheduled_date??'—'} · Completed: {job.completed_date??'—'}</p>
        </div>

        {job.description&&<div className="mt-5 whitespace-pre-line text-sm" style={{color:brand.grey}}><strong style={{color:brand.black}}>Work / site notes</strong><div className="mt-2">{job.description}</div></div>}

        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 font-bold"><ImageIcon className="h-4 w-4"/>{photos.length} site photo{photos.length===1?'':'s'}</div>
          {(['before','progress','after'] as const).map(type=>grouped[type].length>0&&<section key={type} className="mb-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{color:brand.grey}}>{type}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{grouped[type].map(p=><figure key={p.id}>
              <img src={p.photo_url} alt={p.caption??type} className="aspect-[4/3] w-full rounded-lg object-cover" style={{border:`1px solid ${brand.line}`}}/>
              {p.caption&&<figcaption className="mt-1 text-xs" style={{color:brand.grey}}>{p.caption}</figcaption>}
            </figure>)}</div>
          </section>)}
          {!photos.length&&<p className="text-sm" style={{color:brand.grey}}>No site photos were added to this job.</p>}
        </div>

        <div className="mt-7 rounded-xl border p-4" style={{borderColor:brand.line,background:'#FAFAFA'}}>
          <p className="text-sm font-bold" style={{color:brand.black}}>Final payment</p>
          {balance ? (
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div><span style={{color:brand.grey}}>Balance invoice</span><div className="font-bold">{balance.invoice_number}</div></div>
              <div><span style={{color:brand.grey}}>Outstanding</span><div className="font-bold">R {(Number(balance.total_amount)-Number(balance.paid_amount)).toFixed(2)}</div></div>
              <div><span style={{color:brand.grey}}>Status</span><div className="font-bold uppercase">{balance.status}</div></div>
            </div>
          ) : <p className="mt-1 text-xs" style={{color:brand.grey}}>No balance invoice linked yet. Complete the job from the invoice workflow to create the actual outstanding balance.</p>}
        </div>

        <div className="mt-6 rounded-xl border p-4" style={{borderColor:brand.line,background:'#F7F5FA'}}>
          <p className="text-sm font-bold" style={{color:brand.black}}>Thank you — we value your business</p>
          <p className="mt-1 text-xs leading-5" style={{color:brand.grey}}>Thank you for trusting NextGen Maintenance Solutions with your project. If you are happy with our work, your review helps local customers find and trust NGMS.</p>
          <p className="mt-2 text-xs" style={{color:brand.grey}}>If you know a homeowner, landlord, body corporate or business that could use our services, we would really appreciate a referral.</p>
          <div className="no-print mt-3 flex flex-wrap gap-2">
            {settings.google_review_url && <a href={settings.google_review_url} target="_blank" rel="noreferrer" className="rounded-btn bg-blue-fill px-3 py-2 text-xs font-semibold text-white">Google Review</a>}
            {settings.facebook_review_url && <a href={settings.facebook_review_url} target="_blank" rel="noreferrer" className="rounded-btn border px-3 py-2 text-xs font-semibold" style={{borderColor:brand.line,color:brand.black}}>Facebook Review</a>}
            <button onClick={requestReview} disabled={reviewRequested||!!action} className="rounded-btn border px-3 py-2 text-xs font-semibold disabled:opacity-50" style={{borderColor:brand.line,color:brand.black}}>
              {action==='review'?'Saving…':reviewRequested?'Review request recorded':'Record review request'}
            </button>
          </div>
          {!settings.google_review_url&&!settings.facebook_review_url&&<p className="mt-2 text-[11px]" style={{color:'#A15A00'}}>Review links are not configured yet. Add the Google and Facebook review URLs in NGMS Business Settings.</p>}
        </div>

        <div className="mt-8 border-t pt-4 text-xs" style={{borderColor:brand.line,color:brand.grey}}>
          <p>Thank you for choosing NextGen Solar Clean &amp; Maintenance Solutions.</p>
          <p className="mt-1">ONE CALL. ALL SOLUTIONS.</p>
        </div>
      </div>
    </div>
    <style jsx global>{`@media print { body * { visibility:hidden } #completion-report,#completion-report * { visibility:visible } #completion-report { position:absolute;left:0;top:0;width:100%;box-shadow:none!important } .no-print { display:none!important } @page { margin:10mm } }`}</style>
  </main>
}

export default function CompletionPage(){return <StaffGate title="Completion Report"><CompletionView/></StaffGate>}
