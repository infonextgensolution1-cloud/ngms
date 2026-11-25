"use client";

import {useEffect,useState} from "react";
import Link from "next/link";

type PortalData={
 customer:{display_name:string};
 expires_at:string;
 documents:Array<{reference:string;kind:string;amount_cents:number;status:string;issue_date:string;due_date:string|null}>;
 jobs:Array<{reference:string;service:string;area:string;status:string;scheduled_start:string|null;scheduled_end:string|null}>;
 maintenance:Array<{service:string;property_area:string;frequency:string;next_due_date:string|null;amount_cents:number;status:string}>;
};
function zar(cents:number){return new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(cents/100);}
function date(value:string|null|undefined){if(!value)return "Not scheduled";const parsed=new Date(value);return Number.isNaN(parsed.getTime())?value:parsed.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});}

export default function CustomerPortalPage({params}:{params:Promise<{token:string}>}){
 const [token,setToken]=useState("");
 const [data,setData]=useState<PortalData|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;params.then(({token:value})=>{if(active)setToken(value);});return()=>{active=false;};},[params]);
 useEffect(()=>{
  if(!token)return;
  const controller=new AbortController();
  fetch("/api/public/portal/"+encodeURIComponent(token),{cache:"no-store",signal:controller.signal})
   .then(async response=>{const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.error||"Portal link is invalid.");return body as PortalData;})
   .then(value=>setData(value))
   .catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:"Portal could not be loaded.");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[token]);
 return <main className="min-h-screen bg-[#111317] text-white px-4 py-10 sm:py-16">
  <div className="mx-auto max-w-6xl">
   <header className="flex items-center justify-between border-b border-[#383d45] pb-5"><Link href="/" className="font-black uppercase tracking-tight">NEXTGEN <span className="text-[#ff6a00]">NGMS</span></Link><span className="text-xs uppercase tracking-widest text-[#b9bdc4]">Customer Portal</span></header>
   {loading?<p className="py-16 text-[#b9bdc4]">Loading your customer workspace…</p>:error?<section className="mx-auto max-w-xl border border-[#383d45] bg-[#1b1e23] p-8 mt-12"><p className="text-xs tracking-[.2em] text-[#ff6a00] uppercase">Secure access</p><h1 className="text-3xl font-black uppercase mt-3">Portal unavailable.</h1><p className="text-[#c6cbd3] mt-4">{error}</p><Link href="/contact" className="inline-block mt-6 bg-[#ff6a00] text-[#111317] font-bold px-5 py-3">Contact NGMS ↗</Link></section>:data?<><div className="py-10"><p className="text-xs tracking-[.2em] text-[#ff8a3d] uppercase">NGMS / CUSTOMER WORKSPACE</p><h1 className="mt-3 text-4xl sm:text-6xl font-black uppercase tracking-tight">{data.customer.display_name}</h1><p className="mt-3 text-sm text-[#b9bdc4]">Your NGMS quotations, invoices, work history and maintenance plans.</p><p className="mt-2 text-xs text-[#858d99]">Access expires {date(data.expires_at)}.</p></div>
   <div className="grid gap-5 lg:grid-cols-3">
    <section className="border border-[#383d45] bg-[#1b1e23] p-5"><h2 className="text-xl font-bold uppercase">Quotations & invoices</h2>{data.documents.length?<div className="mt-4 space-y-3">{data.documents.map((doc,index)=><article key={doc.reference+index} className="border-t border-[#383d45] pt-3"><div className="flex justify-between gap-2"><strong>{doc.reference}</strong><span className="text-xs text-[#ff9a59]">{doc.status}</span></div><p className="text-xs text-[#b9bdc4] mt-1">{doc.kind} · {date(doc.issue_date)}</p><p className="mt-2 font-semibold">{zar(doc.amount_cents)}</p>{doc.due_date&&<p className="text-xs text-[#b9bdc4]">Due {date(doc.due_date)}</p>}</article>)}</div>:<p className="mt-4 text-sm text-[#b9bdc4]">No quotations or invoices are currently linked to this customer.</p>}</section>
    <section className="border border-[#383d45] bg-[#1b1e23] p-5"><h2 className="text-xl font-bold uppercase">Jobs & visits</h2>{data.jobs.length?<div className="mt-4 space-y-3">{data.jobs.map(job=><article key={job.reference} className="border-t border-[#383d45] pt-3"><div className="flex justify-between gap-2"><strong>{job.reference}</strong><span className="text-xs text-[#ff9a59]">{job.status}</span></div><p className="text-xs text-[#b9bdc4] mt-1">{job.service} · {job.area}</p><p className="text-xs text-[#b9bdc4] mt-2">Scheduled: {date(job.scheduled_start)}</p></article>)}</div>:<p className="mt-4 text-sm text-[#b9bdc4]">No jobs are currently linked to this customer.</p>}</section>
    <section className="border border-[#383d45] bg-[#1b1e23] p-5"><h2 className="text-xl font-bold uppercase">Maintenance plans</h2>{data.maintenance.length?<div className="mt-4 space-y-3">{data.maintenance.map((plan,index)=><article key={plan.service+index} className="border-t border-[#383d45] pt-3"><div className="flex justify-between gap-2"><strong>{plan.service}</strong><span className="text-xs text-[#ff9a59]">{plan.status}</span></div><p className="text-xs text-[#b9bdc4] mt-1">{plan.property_area} · {plan.frequency}</p><p className="text-xs text-[#b9bdc4] mt-2">Next due: {date(plan.next_due_date)}</p><p className="mt-2 font-semibold">{zar(plan.amount_cents)}</p></article>)}</div>:<p className="mt-4 text-sm text-[#b9bdc4]">No maintenance plans are currently linked to this customer.</p>}</section>
   </div><footer className="mt-10 border-t border-[#383d45] pt-5 text-xs text-[#858d99]">This link grants read-only access to the customer account shown above. Contact NGMS if the information appears incorrect.</footer>
  </>:null}
  </div>
 </main>;
}
