"use client";

import {useCallback,useEffect,useState} from "react";

type Media={id:string;original_name:string;content_type:string;category:string;alt_text:string;url:string};
type Slide={id:string;media_id:string;original_name?:string;title:string;eyebrow:string;description:string;button_label:string;button_url:string;sort_order:number;is_active:number;url?:string};

async function json(response:Response){
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(data?.error||"The homepage slide request could not be completed.");
 return data;
}

export default function AdminSlidesPage(){
 const [slides,setSlides]=useState<Slide[]>([]);
 const [media,setMedia]=useState<Media[]>([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [message,setMessage]=useState("");
 const [mediaId,setMediaId]=useState("");
 const [eyebrow,setEyebrow]=useState("NEXTGEN MAINTENANCE SOLUTIONS");
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [buttonLabel,setButtonLabel]=useState("Get a quote");
 const [buttonUrl,setButtonUrl]=useState("/quote");
 const [sortOrder,setSortOrder]=useState("0");

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [slideData,mediaData]=await Promise.all([
    json(await fetch("/api/admin/slides",{cache:"no-store"})),
    json(await fetch("/api/admin/media",{cache:"no-store"}))
   ]);
   setSlides(slideData.items??[]);
   setMedia((mediaData.items??[]).filter((item:Media)=>item.content_type.startsWith("image/")));
  }catch(e){setError(e instanceof Error?e.message:"Carousel records could not be loaded.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);

 async function addSlide(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");setMessage("");
  try{
   await json(await fetch("/api/admin/slides",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    media_id:mediaId,eyebrow,title,description,button_label:buttonLabel,button_url:buttonUrl,sort_order:Number(sortOrder),is_active:true
   })}));
   setMediaId("");setTitle("");setDescription("");setSortOrder(String(slides.length));
   setMessage("Homepage slide created and activated.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Slide could not be created.");}
  finally{setBusy(false);}
 }

 async function updateSlide(slide:Slide,changes:Partial<Slide>){
  setBusy(true);setError("");setMessage("");
  try{
   await json(await fetch("/api/admin/slides/"+encodeURIComponent(slide.id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(changes)}));
   setMessage("Homepage slide updated.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Slide could not be updated.");}
  finally{setBusy(false);}
 }

 async function removeSlide(slide:Slide){
  if(!window.confirm("Remove this slide from the homepage carousel? The original photo will remain in the Media Manager."))return;
  setBusy(true);setError("");setMessage("");
  try{
   await json(await fetch("/api/admin/slides/"+encodeURIComponent(slide.id),{method:"DELETE"}));
   setMessage("Slide removed. The media file remains in the library.");
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Slide could not be removed.");}
  finally{setBusy(false);}
 }

 const activeCount=slides.filter(s=>Number(s.is_active)===1).length;
 return <div className="admin-page">
  <div className="admin-page-top"><div><p className="eyebrow">NGMS / WEBSITE CONTENT</p><h1>HOMEPAGE CAROUSEL</h1><p>Build and manage up to 12 active homepage slides from photographs in the central Media Manager.</p></div><span className="preview-pill">{activeCount} / 12 ACTIVE</span></div>
  {message&&<p className="inline-feedback" role="status">{message}</p>}
  {error&&<p className="action-result action-result-error" role="alert">{error}</p>}
  <section className="action-panel">
   <div className="action-panel-head"><div><strong>Add a homepage slide</strong><small>Upload the image first in Media Library, then select it here.</small></div><span className="preview-pill">MAX 12 ACTIVE</span></div>
   <form onSubmit={addSlide} className="admin-form-grid">
    <label className="admin-form-wide">Image from Media Manager
     <select required value={mediaId} onChange={e=>setMediaId(e.target.value)} disabled={busy} className="mt-1 w-full"><option value="">Choose an image</option>{media.map(item=><option key={item.id} value={item.id}>{item.original_name} · {item.category}</option>)}</select>
    </label>
    {media.find(item=>item.id===mediaId)&&<div className="admin-form-wide"><img src={media.find(item=>item.id===mediaId)?.url} alt="Selected slide preview" className="max-h-48 w-full object-cover"/></div>}
    <label>Eyebrow<input value={eyebrow} onChange={e=>setEyebrow(e.target.value)} maxLength={120} className="mt-1 w-full"/></label>
    <label>Slide headline<input required value={title} onChange={e=>setTitle(e.target.value)} maxLength={220} className="mt-1 w-full"/></label>
    <label className="admin-form-wide">Description<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} maxLength={600} className="mt-1 w-full"/></label>
    <label>Button label<input value={buttonLabel} onChange={e=>setButtonLabel(e.target.value)} maxLength={80} className="mt-1 w-full"/></label>
    <label>Button link<input value={buttonUrl} onChange={e=>setButtonUrl(e.target.value)} maxLength={500} placeholder="/quote" className="mt-1 w-full"/></label>
    <label>Display order<input type="number" min="0" max="999" value={sortOrder} onChange={e=>setSortOrder(e.target.value)} className="mt-1 w-full"/></label>
    <div className="admin-form-wide form-actions"><button className="button button-orange" disabled={busy||activeCount>=12||media.length===0}>{busy?"Saving…":activeCount>=12?"Maximum active slides reached":"Add and activate slide"}</button><span>Activation publishes the selected image for homepage use.</span></div>
   </form>
  </section>

  <section className="data-panel mt-5">
   <div className="data-toolbar"><div><strong>Current slides</strong><small>{loading?"Loading…":slides.length+" total · "+activeCount+" active"}</small></div><button className="button button-small" onClick={()=>void load()} disabled={loading}>Refresh</button></div>
   {loading?<p className="table-empty">Loading carousel…</p>:slides.length===0?<p className="table-empty">No slides created yet. Add images in Media Library and create the first slide above.</p>:
    <div className="divide-y divide-[#383d45]">{slides.map(slide=><div key={slide.id} className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
     <img src={slide.url} alt={slide.title} className="h-36 w-full object-cover border border-[#383d45]"/>
     <form className="min-w-0 grid gap-2 md:grid-cols-2" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);void updateSlide(slide,{eyebrow:String(data.get("eyebrow")??""),title:String(data.get("title")??""),description:String(data.get("description")??""),button_label:String(data.get("button_label")??""),button_url:String(data.get("button_url")??""),sort_order:Number(data.get("sort_order"))});}}>
      <label className="block text-xs">Eyebrow<input name="eyebrow" defaultValue={slide.eyebrow} maxLength={120} className="mt-1 w-full"/></label>
      <label className="block text-xs">Headline<input name="title" defaultValue={slide.title} required maxLength={220} className="mt-1 w-full"/></label>
      <label className="block text-xs md:col-span-2">Description<textarea name="description" defaultValue={slide.description} rows={2} maxLength={600} className="mt-1 w-full"/></label>
      <label className="block text-xs">Button label<input name="button_label" defaultValue={slide.button_label} maxLength={80} className="mt-1 w-full"/></label>
      <label className="block text-xs">Button link<input name="button_url" defaultValue={slide.button_url} maxLength={500} className="mt-1 w-full"/></label>
      <label className="block text-xs">Display order<input name="sort_order" type="number" min="0" max="999" defaultValue={slide.sort_order} className="mt-1 w-full"/></label>
      <div className="flex flex-wrap items-end gap-2"><button type="submit" className="button button-small button-orange" disabled={busy}>Save slide</button><span className="inline-block text-[10px] uppercase tracking-wider border border-[#565d68] px-2 py-1">{Number(slide.is_active)===1?"Active":"Inactive"}</span></div>
     </form>
     <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end"><button type="button" className="button button-small" disabled={busy||Number(slide.is_active)===1} onClick={()=>void updateSlide(slide,{is_active:true})}>Activate</button><button type="button" className="button button-small button-outline button-dark-outline" disabled={busy||Number(slide.is_active)!==1} onClick={()=>void updateSlide(slide,{is_active:false})}>Deactivate</button><button type="button" className="text-xs text-orange underline" disabled={busy} onClick={()=>void removeSlide(slide)}>Remove slide</button></div>
    </div>)}</div>}
  </section>
 </div>;
}
