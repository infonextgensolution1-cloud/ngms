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

const brand={black:'#0A0A0A',purple:'#8B1BF5',grey:'#5B5B5B',line:'#E4E4E4'}

function CompletionView(){
  const params=useParams<{id:string}>()
  const [job,setJob]=useState<Job|null>(null)
  const [client,setClient]=useState<Client|null>(null)
  const [photos,setPhotos]=useState<Photo[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  const load=useCallback(async()=>{
    setLoading(true); setError('')
    try{
      const [jr,pr]=await Promise.all([
        handlersB.ngms_get_job(supabase,{job_id:params.id}),
        handlersC.ngms_list_job_photos(supabase,{job_id:params.id})
      ])
      if(jr.isError) throw new Error(jr.content[0]?.text??'Could not load job')
      const sc=jr.structuredContent as {job:Job;client:Client|null}
      setJob(sc.job); setClient(sc.client); setPhotos((pr.structuredContent?.photos as Photo[])??[])
    }catch(e){setError((e as Error).message)}
    finally{setLoading(false)}
  },[params.id])

  useEffect(()=>{void load()},[load])

  const grouped=useMemo(()=>{
    const g:{before:Photo[];progress:Photo[];after:Photo[]}={before:[],progress:[],after:[]}
    photos.forEach(p=>{if(p.type in g) g[p.type as keyof typeof g].push(p)})
    return g
  },[photos])

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
