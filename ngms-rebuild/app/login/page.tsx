"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setError("");
    try {
      const response=await fetch("/api/auth/login",{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        cache:"no-store",
        body:JSON.stringify({email,password}),
      });
      const result=await response.json().catch(()=>null) as {ok?:boolean;error?:string}|null;
      if(!response.ok||!result?.ok) throw new Error(result?.error||"Sign in failed.");
      router.replace("/admin");
      router.refresh();
    } catch(e) {
      setError(e instanceof Error?e.message:"Sign in failed.");
    } finally {setBusy(false);}
  }

  return <main className="min-h-screen bg-[#111317] text-white px-4 py-16 flex items-center justify-center">
    <div className="w-full max-w-md border border-[#383d45] bg-[#1b1e23] p-7 sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-[#ff6a00]">NGMS / BUSINESS CONTROL</p>
      <h1 className="mt-4 text-3xl font-black uppercase tracking-tight">Welcome back.</h1>
      <p className="mt-2 text-sm text-[#b9bdc4]">Sign in to manage enquiries, quotations, jobs and website media.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-semibold">Email address
          <input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 block w-full border border-[#414750] bg-[#101216] p-3 text-white" />
        </label>
        <label className="block text-sm font-semibold">Password
          <input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 block w-full border border-[#414750] bg-[#101216] p-3 text-white" />
        </label>
        {error&&<p className="text-sm text-[#ff8b58]" role="alert">{error}</p>}
        <button disabled={busy} className="w-full bg-[#ff6a00] px-5 py-3 font-bold uppercase text-[#111317] disabled:opacity-60">{busy?"Signing in…":"Sign in to NGMS"}</button>
      </form>
      <div className="mt-6 border-t border-[#383d45] pt-4 text-xs text-[#a8adb5]">
        First-time setup? <Link href="/setup" className="font-semibold text-[#ff8b58] underline">Create the owner account</Link>
      </div>
      <Link href="/" className="mt-5 inline-block text-sm text-[#b9bdc4] underline">Return to public website</Link>
    </div>
  </main>;
}
