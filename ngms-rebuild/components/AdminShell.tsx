"use client";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "@/components/PublicShell";
const items = [
  {href:"/admin",label:"Overview",glyph:"▦"},
  {href:"/admin/enquiries",label:"Enquiries & customers",glyph:"↗"},
  {href:"/admin/jobs",label:"Jobs",glyph:"◇"},
  {href:"/admin/projects",label:"Projects & before/after",glyph:"▧"},
  {href:"/admin/quotes",label:"Quotations",glyph:"▤"},
  {href:"/admin/invoices",label:"Invoices",glyph:"R"},
  {href:"/admin/calendar",label:"Calendar",glyph:"▦"},
  {href:"/admin/media",label:"Media library",glyph:"▧"},
  {href:"/admin/content",label:"Website content",glyph:"☷"},
  {href:"/admin/reports",label:"Reports",glyph:"▥"},
  {href:"/admin/settings",label:"Settings & access",glyph:"⚙"}
];
export function AdminShell({children}:{children:ReactNode}) {
 const pathname=usePathname();
 const router=useRouter();
 const [signingOut,setSigningOut]=useState(false);
 async function signOut(){
   setSigningOut(true);
   try{await fetch("/api/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"}});}finally{router.replace("/login");router.refresh();}
 }
 return <div className="admin-app"><aside className="admin-sidebar"><div className="admin-brand"><Brand/><p>BUSINESS CONTROL</p></div><div className="workspace-card"><span className="workspace-avatar">N</span><div><strong>NGMS Workspace</strong><small>HostAfrica operations</small></div></div><p className="sidebar-label">WORKSPACE</p><nav className="admin-nav" aria-label="Admin navigation">{items.map((i)=><Link key={i.href} href={i.href} className={pathname===i.href?"active":""} aria-current={pathname===i.href?"page":undefined}><span className="nav-glyph" aria-hidden="true">{i.glyph}</span>{i.label}</Link>)}</nav><div className="sidebar-bottom"><span className="admin-avatar">N</span><div className="min-w-0"><strong>NGMS Administrator</strong><small>Secure workspace</small></div><button type="button" onClick={signOut} disabled={signingOut} className="ml-auto text-xs font-bold text-[#ff8b58] underline disabled:opacity-50">{signingOut?"Signing out":"Sign out"}</button></div></aside><div className="admin-main"><div className="admin-topbar"><div className="breadcrumb"><Link href="/">Public website</Link><span>/</span><span>Business control</span></div><div className="admin-top-actions"><span className="preview-pill">HOSTAFRICA STAGING</span><span className="admin-avatar">N</span></div></div><main className="admin-content"><div className="preview-data-banner" role="note"><strong>NGMS STAGING WORKSPACE</strong><span>This environment is isolated from the current live website. Confirm all records before a production cutover.</span></div>{children}</main></div></div>;
}
export function ApiStatusNotice(){return <div className="api-notice" role="status"><span className="notice-dot" aria-hidden="true"/><div><strong>HostAfrica application backend</strong><p>Business records are stored in the dedicated HostAfrica database. Media files are stored outside the public web directory.</p></div></div>;}
