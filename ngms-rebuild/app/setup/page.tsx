"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage(){
  const router=useRouter();
  const [available,setAvailable]=useState<boolean|null>(null);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{fetch("/api/setup/admin",{cache:"no-store"}).then(r=>r.json()).then(d=>setAvailable(Boolean(d.available))).catch(()=>setAvailable(false));},[]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    try{
      const response=await fetch("/api/setup/admin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password,setup_token:token})});
      const result=await response.json().catch(()=>null) as {ok?:boolean;error?:string}|null;
      if(!response.ok||!result?.ok) throw new Error(result?.error||"Owner account could not be created.");
      router.replace("/login");
    }catch(e){setError(e instanceof Error?e.message:"Setup failed.");}
    finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-[#111317] text-white px-4 py-16 flex items-center justify-center">
    <div className="w-full max-w-lg border border-[#383d45] bg-[#1b1e23] p-7 sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#ff6a00]">NGMS / INITIAL CONFIGURATION</p>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">Create owner account.</h1>
      <p className="mt-2 text-sm text-[#b9bdc4]">This one-time operation creates the first administrator. The setup token is configured only in the HostAfrica server environment.</p>
      {available===null?<p className="mt-6 text-sm text-[#b9bdc4]">Checking setup status…</p>:!available?
        <div className="mt-6 border border-[#80502d] bg-[#302117] p-4 text-sm text-[#ffd4b6]">Owner setup is unavailable. The database may not be migrated yet, or an owner account already exists. Ask the existing administrator to sign in.</div>:
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold">Setup token<input required type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} className="mt-2 block w-full border border-[#414750] bg-[#101216] p-3 text-white"/></label>
          <label className="block text-sm font-semibold">Owner name<input required minLength={2} maxLength={160} value={name} onChange={e=>setName(e.target.value)} className="mt-2 block w-full border border-[#414750] bg-[#101216] p-3 text-white"/></label>
          <label className="block text-sm font-semibold">Owner email<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 block w-full border border-[#414750] bg-[#101216] p-3 text-white"/></label>
          <label className="block text-sm font-semibold">Password (minimum 12 characters)<input required type="password" minLength={12} maxLength={200} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 block w-full border border-[#414750] bg-[#101216] p-3 text-white"/></label>
          {error&&<p className="text-sm text-[#ff8b58]" role="alert">{error}</p>}
          <button disabled={busy} className="w-full bg-[#ff6a00] px-5 py-3 font-bold uppercase text-[#111317] disabled:opacity-60">{busy?"Creating owner…":"Create owner account"}</button>
        </form>}
      <Link href="/login" className="mt-6 inline-block text-sm text-[#ff8b58] underline">Return to sign in</Link>
    </div>
  </main>;
}
