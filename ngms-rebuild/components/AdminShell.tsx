"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/PublicShell";
const items = [
  {href:"/admin",label:"Overview",glyph:"▦"},
  {href:"/admin/enquiries",label:"Enquiries & customers",glyph:"↗"},
  {href:"/admin/jobs",label:"Jobs",glyph:"◇"},
  {href:"/admin/quotes",label:"Quotations",glyph:"▤"},
  {href:"/admin/invoices",label:"Invoices",glyph:"R"},
  {href:"/admin/calendar",label:"Calendar",glyph:"▦"},
  {href:"/admin/media",label:"Media library",glyph:"▧"},
  {href:"/admin/content",label:"Website content",glyph:"☷"},
  {href:"/admin/reports",label:"Reports",glyph:"▥"},
  {href:"/admin/settings",label:"Settings & access",glyph:"⚙"}
];
export function AdminShell({children}:{children:ReactNode}) {
 const pathname = usePathname();
 return <div className="admin-app"><aside className="admin-sidebar"><div className="admin-brand"><Brand/><p>BUSINESS CONTROL</p></div><div className="workspace-card"><span className="workspace-avatar">N</span><div><strong>NGMS Workspace</strong><small>Maintenance operations</small></div></div><p className="sidebar-label">WORKSPACE</p><nav className="admin-nav" aria-label="Admin navigation">{items.map((i)=><Link key={i.href} href={i.href} className={pathname===i.href?"active":""} aria-current={pathname===i.href?"page":undefined}><span className="nav-glyph" aria-hidden="true">{i.glyph}</span>{i.label}</Link>)}</nav><div className="sidebar-bottom"><span className="admin-avatar">A</span><div><strong>Administrator</strong><small>Preview interface</small></div></div></aside><div className="admin-main"><div className="admin-topbar"><div className="breadcrumb"><Link href="/">Public website</Link><span>/</span><span>Business control</span></div><div className="admin-top-actions"><span className="preview-pill">REBUILD PREVIEW</span><span className="admin-avatar">A</span></div></div><main className="admin-content">{children}</main></div></div>;
}
export function ApiStatusNotice() {return <div className="api-notice" role="status"><span className="notice-dot" aria-hidden="true"/><div><strong>Backend integration pending</strong><p>This rebuild does not simulate live records. The protected Worker API, authentication contract and D1/R2 resources must be verified before data operations are enabled.</p></div></div>;}
