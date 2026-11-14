"use client";

import {useCallback,useEffect,useState} from "react";

type Customer={id:string;display_name:string;primary_phone:string;primary_email:string;customer_type:string;service_address:string;created_at:string};
async function json(response:Response){const data=await response.json().catch(()=>null);if(!response.ok)throw new Error(data?.error||"Customer request failed.");return data;}

export default function AdminCustomersPage(){
 const [customers,setCustomers]=useState<Customer[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState<string|null>(null);
 const [search,setSearch]=useState("");
 const [generated,setGenerated]=useState<{id:string;name:string;url:string;expires_at:string}|null>(null);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{const data=await json(await fetch("/api/admin/customers",{cache:"no-store"}));setCustomers(data.items??[]);}
  catch(e){setError(e instanceof Error?e.message:"Customers could not be loaded.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);

 async function createPortal(customer:Customer){
  setBusy(customer.id);setError("");setMessage("");setGenerated(null);
  try{
   const data=await json(await fetch("/api/admin/customers/"+encodeURIComponent(customer.id)+"/portal-link",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}));
   setGenerated({id:customer.id,name:customer.display_name,url:data.url,expires_at:data.expires_at});
   setMessage("A customer portal link has been generated. Copy it and send it through your approved customer communication channel.");
  }catch(e){setError(e instanceof Error?e.message:"Portal link could not be created.");}
  finally{setBusy(null);}
 }

 async function copyLink(){
  if(!generated)return;
  try{await navigator.clipboard.writeText(generated.url);setMessage("Customer portal link copied to clipboard.");}
  catch{setMessage("Copy is unavailable in this browser. Select and copy the link manually.");}
 }

 const visible=customers.filter(customer=>[customer.display_name,customer.primary_phone,customer.primary_email,customer.service_address].join(" ").toLowerCase().includes(search.toLowerCase()));
 return <div className="admin-page">
  <div className="admin-page-top"><div><p className="eyebrow">NGMS / CRM</p><h1>CUSTOMERS</h1><p>Customer profiles and secure read-only portal access.</p></div><button className="button button-small" onClick={()=>void load()} disabled={loading}>Refresh</button></div>
  {message&&<p className="inline-feedback" role="status">{message}</p>}
  {error&&<p className="action-result action-result-error" role="alert">{error}</p>}
  {generated&&<section className="action-panel mt-4"><div className="action-panel-head"><div><strong>Portal access link for {generated.name}</strong><small>Expires {new Date(generated.expires_at).toLocaleString("en-ZA")}. Anyone with this link can view this customer's portal until expiry or revocation.</small></div><button className="button button-small button-orange" onClick={()=>void copyLink()}>Copy link</button></div><input readOnly value={generated.url} onFocus={e=>e.currentTarget.select()} className="mt-2 w-full"/></section>}
  <section className="data-panel mt-5">
   <div className="data-toolbar"><div><strong>Customer register</strong><small>{loading?"Loading…":visible.length+" customers"}</small></div><input aria-label="Search customers" placeholder="Search name, phone, email…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
   {loading?<p className="table-empty">Loading customer records…</p>:visible.length===0?<p className="table-empty">No customer records found.</p>:<div className="table-scroll"><table><thead><tr><th>Customer</th><th>Contact</th><th>Property / site</th><th>Type</th><th>Portal access</th></tr></thead><tbody>{visible.map(customer=><tr key={customer.id}><td><strong>{customer.display_name}</strong></td><td>{customer.primary_phone||"—"}<br/><span className="text-xs text-mist">{customer.primary_email}</span></td><td>{customer.service_address||"—"}</td><td>{customer.customer_type}</td><td><button className="button button-small" disabled={busy===customer.id} onClick={()=>void createPortal(customer)}>{busy===customer.id?"Creating…":"Generate portal link"}</button></td></tr>)}</tbody></table></div>}
  </section>
 </div>;
}
