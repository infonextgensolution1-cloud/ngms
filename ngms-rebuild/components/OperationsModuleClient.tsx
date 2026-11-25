"use client";

import { useCallback,useEffect,useMemo,useState } from "react";

type Category="suppliers"|"materials"|"purchases"|"expenses"|"staff"|"subcontractors"|"wages"|"maintenance";
type OperationRow=Record<string,unknown>&{id:string;status?:string};
type Field={name:string;label:string;type?:"text"|"email"|"tel"|"number"|"date"|"textarea"|"select";required?:boolean;step?:string;min?:string;options?:string[];placeholder?:string;lookup?:string};

const DEFINITIONS:Record<Category,{title:string;description:string;fields:Field[];columns:string[];labels:Record<string,string>;statuses:string[]}> = {
 suppliers:{title:"Suppliers",description:"Maintain supplier contacts, categories and approval status.",fields:[
  {name:"name",label:"Supplier / company name",required:true},{name:"contact_name",label:"Contact person"},{name:"phone",label:"Telephone",type:"tel"},{name:"email",label:"Email",type:"email"},{name:"category",label:"Supplier category"},{name:"address",label:"Address"},{name:"notes",label:"Notes",type:"textarea"}
 ],columns:["name","contact_name","phone","email","category","status"],labels:{name:"Supplier",contact_name:"Contact",phone:"Telephone",email:"Email",category:"Category",status:"Status"},statuses:["Active","Pending approval","On hold","Inactive"]},
 materials:{title:"Materials & Stock",description:"Track materials, quantities, reorder levels and unit costs.",fields:[
  {name:"name",label:"Material name",required:true},{name:"sku",label:"SKU / code"},{name:"category",label:"Category"},{name:"unit",label:"Unit",placeholder:"e.g. each, litre, bag"},{name:"quantity",label:"Current quantity",type:"number",step:"0.001",min:"0"},{name:"minimum_quantity",label:"Minimum stock level",type:"number",step:"0.001",min:"0"},{name:"unit_cost",label:"Unit cost (ZAR)",type:"number",step:"0.01",min:"0"},{name:"notes",label:"Notes",type:"textarea"}
 ],columns:["name","sku","category","quantity","minimum_quantity","unit_cost_cents","status"],labels:{name:"Material",sku:"SKU",category:"Category",quantity:"Quantity",minimum_quantity:"Reorder at",unit_cost_cents:"Unit cost",status:"Stock status"},statuses:["In stock","Low stock","Out of stock","Discontinued"]},
 purchases:{title:"Purchases",description:"Record supplier purchases and material receipts.",fields:[
  {name:"description",label:"Purchase description",required:true},{name:"supplier_id",label:"Supplier (optional)",type:"select",lookup:"suppliers"},{name:"material_id",label:"Material (optional)",type:"select",lookup:"materials"},{name:"invoice_reference",label:"Supplier invoice / reference"},{name:"quantity",label:"Quantity",type:"number",step:"0.001",min:"0.001",required:true},{name:"unit_cost",label:"Unit cost (ZAR)",type:"number",step:"0.01",min:"0",required:true},{name:"purchased_at",label:"Purchase date",type:"date",required:true},{name:"notes",label:"Notes",type:"textarea"}
 ],columns:["description","supplier_name","material_name","invoice_reference","quantity","total_cents","purchased_at","status"],labels:{description:"Purchase",supplier_name:"Supplier",material_name:"Material",invoice_reference:"Reference",quantity:"Quantity",total_cents:"Total",purchased_at:"Date",status:"Status"},statuses:["Recorded","Pending payment","Paid","Cancelled"]},
 expenses:{title:"Expenses",description:"Capture business expenditure and job-related costs. Amounts are stored in cents.",fields:[
  {name:"expense_date",label:"Expense date",type:"date",required:true},{name:"category",label:"Expense category",required:true,placeholder:"e.g. Fuel, tools, materials"},{name:"description",label:"Description",required:true},{name:"amount",label:"Amount (ZAR)",type:"number",step:"0.01",min:"0.01",required:true},{name:"job_id",label:"Job (optional)",type:"select",lookup:"jobs"},{name:"supplier_id",label:"Supplier (optional)",type:"select",lookup:"suppliers"},{name:"invoice_reference",label:"Receipt / invoice reference"},{name:"notes",label:"Notes",type:"textarea"}
 ],columns:["expense_date","category","description","amount_cents","invoice_reference","status"],labels:{expense_date:"Date",category:"Category",description:"Expense",amount_cents:"Amount",invoice_reference:"Reference",status:"Status"},statuses:["Pending","Approved","Paid","Rejected"]},
 staff:{title:"Staff",description:"Manage staff profiles and agreed hourly rates. Banking and payroll credentials are not stored in this module.",fields:[
  {name:"full_name",label:"Full name",required:true},{name:"phone",label:"Telephone",type:"tel"},{name:"email",label:"Email",type:"email"},{name:"position",label:"Position / trade"},{name:"employment_type",label:"Employment type",type:"select",options:["Employee","Casual","Contractor","Part-time"]},{name:"hourly_rate",label:"Hourly rate (ZAR)",type:"number",step:"0.01",min:"0"},{name:"notes",label:"Notes",type:"textarea"}
 ],columns:["full_name","phone","email","position","employment_type","hourly_rate_cents","status"],labels:{full_name:"Name",phone:"Telephone",email:"Email",position:"Position",employment_type:"Type",hourly_rate_cents:"Hourly rate",status:"Status"},statuses:["Active","On leave","Inactive"]},
 subcontractors:{title:"Subcontractors",description:"Maintain subcontractor contacts, trades and approval status.",fields:[
  {name:"company_name",label:"Company / contractor name",required:true},{name:"contact_name",label:"Contact person"},{name:"phone",label:"Telephone",type:"tel"},{name:"email",label:"Email",type:"email"},{name:"service",label:"Trade / service"},{name:"compliance_notes",label:"Compliance and notes",type:"textarea"}
 ],columns:["company_name","contact_name","phone","email","service","status"],labels:{company_name:"Company",contact_name:"Contact",phone:"Telephone",email:"Email",service:"Trade",status:"Status"},statuses:["Pending approval","Approved","On hold","Inactive"]},
 wages:{title:"Wages & Labour",description:"Prepare wage calculations by staff member and pay period. This is an internal record, not a bank payment instruction.",fields:[
  {name:"staff_profile_id",label:"Staff member",required:true,type:"select",lookup:"staff"},{name:"period_start",label:"Period start",type:"date",required:true},{name:"period_end",label:"Period end",type:"date",required:true},{name:"hours_worked",label:"Hours worked",type:"number",step:"0.01",min:"0.01",required:true},{name:"rate",label:"Hourly rate (ZAR; leave 0 to use profile rate)",type:"number",step:"0.01",min:"0"},{name:"deductions",label:"Deductions (ZAR)",type:"number",step:"0.01",min:"0"},{name:"notes",label:"Notes",type:"textarea"}
 ],columns:["staff_name","period_start","period_end","hours_worked","gross_cents","deductions_cents","net_cents","status"],labels:{staff_name:"Staff",period_start:"From",period_end:"To",hours_worked:"Hours",gross_cents:"Gross",deductions_cents:"Deductions",net_cents:"Net",status:"Status"},statuses:["Draft","Approved","Paid","Cancelled"]},
 maintenance:{title:"Maintenance Plans",description:"Manage recurring customer maintenance arrangements and next-due dates.",fields:[
  {name:"customer_name",label:"Customer / property name",required:true},{name:"customer_id",label:"Customer (optional)",type:"select",lookup:"customers"},{name:"service",label:"Service",required:true},{name:"property_area",label:"Property area / suburb"},{name:"frequency",label:"Frequency",type:"select",required:true,options:["Monthly","Every 2 months","Quarterly","Every 4 months","Twice yearly","Annually","Custom"]},{name:"start_date",label:"Start date",type:"date"},{name:"next_due_date",label:"Next service due",type:"date"},{name:"amount",label:"Plan amount (ZAR)",type:"number",step:"0.01",min:"0"},{name:"notes",label:"Notes",type:"textarea"}
 ],columns:["customer_name","service","property_area","frequency","next_due_date","amount_cents","status"],labels:{customer_name:"Customer",service:"Service",property_area:"Area",frequency:"Frequency",next_due_date:"Next due",amount_cents:"Plan amount",status:"Status"},statuses:["Draft","Active","Due","Paused","Completed","Cancelled"]}
};

function display(key:string,value:unknown):string{
 if(value===null||value===undefined||value==="")return "—";
 if(["amount_cents","unit_cost_cents","total_cents","hourly_rate_cents","gross_cents","deductions_cents","net_cents"].includes(key)&&typeof value==="number")return new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(value/100);
 if(["created_at","updated_at","expense_date","purchased_at","next_due_date","period_start","period_end"].includes(key)&&typeof value==="string"){
  const d=new Date(value);return Number.isNaN(d.getTime())?value:d.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});
 }
 return String(value);
}

async function getJson(response:Response):Promise<any>{
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(data?.error||"The operation could not be completed.");
 return data;
}

export default function OperationsModuleClient({category}:{category:Category}){
 const definition=DEFINITIONS[category];
 const [items,setItems]=useState<OperationRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [showForm,setShowForm]=useState(false);
 const [search,setSearch]=useState("");
 const [refresh,setRefresh]=useState(0);
 const [lookups,setLookups]=useState<Record<string,Array<Record<string,unknown>>>>({});

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const data=await getJson(await fetch("/api/admin/operations/"+category,{cache:"no-store"}));
   setItems(data.items??[]);
  }catch(e){setItems([]);setError(e instanceof Error?e.message:"Records could not be loaded.");}
  finally{setLoading(false);}
 },[category]);
 useEffect(()=>{void load();},[load,refresh]);
 useEffect(()=>{let active=true;const endpoints=["suppliers","materials","staff","customers","jobs"];Promise.all(endpoints.map(async key=>{const url=key==="customers"||key==="jobs"?"/api/admin/"+key:"/api/admin/operations/"+key;const response=await fetch(url,{cache:"no-store"});return [key,(await getJson(response)).items??[]] as const;})).then(results=>{if(active)setLookups(Object.fromEntries(results));}).catch(()=>{if(active)setLookups({});});return()=>{active=false;};},[refresh]);

 const visible=useMemo(()=>{
  const term=search.trim().toLowerCase();
  return !term?items:items.filter(item=>Object.values(item).some(value=>String(value??"").toLowerCase().includes(term)));
 },[items,search]);

 async function create(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setMessage("");
  const form=event.currentTarget;const data=new FormData(form);
  const payload:Record<string,unknown>={};
  for(const field of definition.fields){
   const value=String(data.get(field.name)??"").trim();
   if(value)payload[field.name]=field.type==="number"?Number(value):value;
  }
  try{
   await getJson(await fetch("/api/admin/operations/"+category,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}));
   form.reset();setMessage("Record saved to NGMS Operations Manager.");setShowForm(false);setRefresh(v=>v+1);
  }catch(e){setError(e instanceof Error?e.message:"Record could not be saved.");}
  finally{setBusy(false);}
 }

 async function changeStatus(item:OperationRow,status:string){
  setBusy(true);setError("");setMessage("");
  try{
   await getJson(await fetch("/api/admin/operations/"+category+"/"+encodeURIComponent(item.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})}));
   setMessage("Status updated.");setRefresh(v=>v+1);
  }catch(e){setError(e instanceof Error?e.message:"Status could not be updated.");}
  finally{setBusy(false);}
 }

 return <div className="admin-page">
  <div className="admin-page-top">
   <div><p className="eyebrow">NGMS / OPERATIONS MANAGER</p><h1>{definition.title.toUpperCase()}</h1><p>{definition.description}</p></div>
   <button className="button button-orange" type="button" onClick={()=>setShowForm(v=>!v)} disabled={busy}>{showForm?"Close form":"+ Add record"}</button>
  </div>
  {message&&<p className="inline-feedback" role="status">{message}</p>}
  {error&&<p className="action-result action-result-error" role="alert">{error}</p>}
  {showForm&&<section className="action-panel">
   <div className="action-panel-head"><div><strong>New {definition.title.toLowerCase()} record</strong><small>All values are stored in the isolated HostAfrica staging database.</small></div><span className="preview-pill">HOSTAFRICA</span></div>
   <form className="admin-form-grid" onSubmit={create}>
    {definition.fields.map(field=><label key={field.name} className={field.type==="textarea"?"admin-form-wide block text-xs":"block text-xs"}>
     {field.label}
     {field.type==="textarea"?<textarea name={field.name} rows={3} maxLength={4000} className="mt-1 w-full"/>:
      field.type==="select"?<select name={field.name} defaultValue="" required={field.required} className="mt-1 w-full"><option value="">Choose…</option>{(field.options??[]).map(option=><option key={option}>{option}</option>)}{field.lookup==="suppliers"&&(lookups.suppliers??[]).map(item=><option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}{field.lookup==="materials"&&(lookups.materials??[]).map(item=><option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}{field.lookup==="staff"&&(lookups.staff??[]).map(item=><option key={String(item.id)} value={String(item.id)}>{String(item.full_name)}</option>)}{field.lookup==="customers"&&(lookups.customers??[]).map(item=><option key={String(item.id)} value={String(item.id)}>{String(item.display_name)}</option>)}{field.lookup==="jobs"&&(lookups.jobs??[]).map(item=><option key={String(item.id)} value={String(item.id)}>{String(item.reference??item.id)} · {String(item.customer_name??"")}</option>)}</select>:
      <input name={field.name} type={field.type??"text"} step={field.step} min={field.min} required={field.required} placeholder={field.placeholder} className="mt-1 w-full"/>}
    </label>)}
    <div className="admin-form-wide form-actions"><button className="button button-orange" disabled={busy}>{busy?"Saving…":"Save record"}</button><button type="button" className="button button-outline button-dark-outline" disabled={busy} onClick={()=>setShowForm(false)}>Cancel</button></div>
   </form>
  </section>}
  <section className="data-panel mt-5">
   <div className="data-toolbar"><div><strong>{definition.title} register</strong><small>{loading?"Loading…":visible.length+" records"}</small></div><input placeholder="Search records…" aria-label="Search records" value={search} onChange={e=>setSearch(e.target.value)}/><button className="button button-small" type="button" onClick={()=>setRefresh(v=>v+1)} disabled={loading}>Refresh</button></div>
   {loading?<p className="table-empty">Loading records…</p>:error?<p className="table-empty">Records are unavailable. Retry after checking the HostAfrica database connection.</p>:visible.length===0?<p className="table-empty">No records have been added yet.</p>:
    <div className="table-scroll"><table><thead><tr>{definition.columns.map(key=><th key={key}>{definition.labels[key]??key}</th>)}<th>Update status</th></tr></thead>
     <tbody>{visible.map(item=><tr key={item.id}>{definition.columns.map(key=><td key={key}>{display(key,item[key])}</td>)}<td><select aria-label={"Status for "+String(item.id)} value={String(item.status??"")} onChange={e=>void changeStatus(item,e.target.value)} disabled={busy||!definition.statuses.includes(String(item.status??""))}>{definition.statuses.map(status=><option key={status}>{status}</option>)}</select></td></tr>)}</tbody>
    </table></div>}
  </section>
 </div>;
}
