"use client";

import { useCallback, useEffect, useState } from "react";

type MediaEntry = {
  id: string;
  original_name: string;
  content_type: string;
  category: string;
  alt_text: string;
  is_published: number;
};
type Project = {
  id: string;
  title: string;
  service: string;
  location: string;
  description: string;
  completed_at: string | null;
  status: "Draft" | "Published" | "Archived";
  photo_count?: number;
};
type ProjectPhoto = {
  project_photo_id: string;
  media_id: string;
  stage: "before" | "after" | "general";
  original_name: string;
  url: string;
  is_published: number;
};
type ProjectDetail = { item: Project; photos: ProjectPhoto[] };

async function readResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "The request could not be completed.");
  return data;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [selected, setSelected] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [service, setService] = useState("Solar Panel Cleaning");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [projectsResponse, mediaResponse] = await Promise.all([
        fetch("/api/admin/projects", { cache: "no-store" }),
        fetch("/api/admin/media", { cache: "no-store" }),
      ]);
      const [projectData, mediaData] = await Promise.all([
        readResponse(projectsResponse),
        readResponse(mediaResponse),
      ]);
      setProjects(projectData.items ?? []);
      setMedia((mediaData.items ?? []).filter((item: MediaEntry) => item.content_type.startsWith("image/")));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function openProject(id: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const detail = await readResponse(await fetch("/api/admin/projects/" + encodeURIComponent(id), { cache: "no-store" }));
      setSelected(detail as ProjectDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await readResponse(await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, service, location, description }),
      }));
      setTitle("");
      setLocation("");
      setDescription("");
      await load();
      await openProject(data.item.id);
      setMessage("Project created as a draft. Add its photographs and publish when ready.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function attachPhoto(stage: "before" | "after") {
    if (!selected) return;
    const mediaId = stage === "before" ? beforeId : afterId;
    if (!mediaId) {
      setError("Choose a photograph from the Media Manager first.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await readResponse(await fetch("/api/admin/projects/" + encodeURIComponent(selected.item.id) + "/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ media_id: mediaId, stage }),
      }));
      setBeforeId("");
      setAfterId("");
      await openProject(selected.item.id);
      await load();
      setMessage(stage.toUpperCase() + " photograph linked to the project.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photograph could not be linked.");
    } finally {
      setBusy(false);
    }
  }

  async function detachPhoto(photoId: string) {
    if (!selected || !window.confirm("Remove this photograph from the project? The media file itself will remain in the Media Manager.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await readResponse(await fetch("/api/admin/projects/" + encodeURIComponent(selected.item.id) + "/photos/" + encodeURIComponent(photoId), {
        method: "DELETE",
      }));
      await openProject(selected.item.id);
      await load();
      setMessage("Photograph removed from project. The original file remains in the Media Manager.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photograph could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status: "Draft" | "Published" | "Archived") {
    if (!selected) return;
    if (status === "Published" && !window.confirm("Publish this project and make its linked photographs visible on the public website?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await readResponse(await fetch("/api/admin/projects/" + encodeURIComponent(selected.item.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }));
      setSelected(current => current ? { ...current, item: data.item } : current);
      await load();
      setMessage(status === "Published"
        ? "Project and linked photographs are now public."
        : status === "Archived" ? "Project archived." : "Project returned to draft. Linked photos are no longer public unless used in another published project.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Project status could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  const photoGroup = (stage: "before" | "after") => selected?.photos.filter(photo => photo.stage === stage) ?? [];
  const availableMedia = media;

  return (
    <div className="admin-page">
      <div className="admin-page-top">
        <div>
          <p className="eyebrow">NGMS / MEDIA & PROJECTS</p>
          <h1>PROJECT MANAGER</h1>
          <p>Create project entries and pair authentic before-and-after photographs from the central Media Manager.</p>
        </div>
      </div>

      <section className="action-panel">
        <div className="action-panel-head">
          <div><strong>Create a project</strong><small>Projects remain drafts until explicitly published.</small></div>
          <span className="preview-pill">PROJECT CMS</span>
        </div>
        <form onSubmit={createProject} className="grid gap-3 md:grid-cols-2">
          <label className="block text-xs">Project title
            <input required minLength={2} maxLength={180} value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full" />
          </label>
          <label className="block text-xs">Service
            <select value={service} onChange={e => setService(e.target.value)} className="mt-1 w-full">
              {["Solar Panel Cleaning","Painting","Waterproofing","Plumbing","Electrical","Paving","Pool Fibre Lining","High-Pressure Cleaning","Steelwork & Welding","Handyman","Rubble Removal","Subcontractor Work","Body Corporate Maintenance","General Property Maintenance"].map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="block text-xs">Location / suburb
            <input maxLength={180} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Somerset West" className="mt-1 w-full" />
          </label>
          <label className="block text-xs">Description
            <textarea maxLength={4000} rows={2} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full" />
          </label>
          <button className="button button-orange md:col-span-2" disabled={busy}>Create draft project</button>
        </form>
      </section>

      {message && <p className="inline-feedback mt-3" role="status">{message}</p>}
      {error && <p className="text-orange mt-3" role="alert">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,.8fr)_minmax(0,1.5fr)] mt-5">
        <section className="data-panel">
          <div className="data-toolbar">
            <div><strong>Projects</strong><small>{projects.length} records</small></div>
            <button className="button button-small" onClick={() => void load()} disabled={loading}>Refresh</button>
          </div>
          {loading ? <p className="p-4 text-sm text-mist">Loading projects…</p>
          : projects.length === 0 ? <p className="p-4 text-sm text-mist">No projects created yet.</p>
          : <div className="divide-y divide-[#383d45]">
            {projects.map(project => (
              <button key={project.id} type="button" onClick={() => void openProject(project.id)}
                className={"block w-full p-4 text-left hover:bg-white/5 " + (selected?.item.id === project.id ? "bg-white/5" : "")}>
                <strong>{project.title}</strong>
                <span className="block text-xs text-mist mt-1">{project.service} · {project.location || "Location not set"}</span>
                <span className="inline-block mt-2 text-[10px] uppercase tracking-wider border border-[#565d68] px-2 py-1">{project.status}</span>
                <span className="ml-2 text-xs text-mist">{project.photo_count ?? 0} photos</span>
              </button>
            ))}
          </div>}
        </section>

        <section className="data-panel">
          <div className="data-toolbar">
            <div><strong>{selected?.item.title || "Select a project"}</strong><small>{selected ? "Add, review and publish project evidence" : "Choose a project from the list"}</small></div>
          </div>
          {selected ? <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="preview-pill">{selected.item.status}</span>
              <button className="button button-small button-orange" disabled={busy || selected.item.status === "Published"} onClick={() => void setStatus("Published")}>Publish project</button>
              <button className="button button-small button-outline button-dark-outline" disabled={busy || selected.item.status === "Draft"} onClick={() => void setStatus("Draft")}>Unpublish</button>
              <button className="button button-small button-outline button-dark-outline" disabled={busy} onClick={() => void setStatus("Archived")}>Archive</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(["before","after"] as const).map(stage => (
                <div key={stage} className="border border-[#383d45] p-3">
                  <strong className="text-sm uppercase">{stage} photographs</strong>
                  <label className="block text-xs mt-3">Choose image from Media Manager
                    <select value={stage === "before" ? beforeId : afterId}
                      onChange={e => stage === "before" ? setBeforeId(e.target.value) : setAfterId(e.target.value)}
                      className="mt-1 w-full">
                      <option value="">Select image</option>
                      {availableMedia.map(item => <option key={item.id} value={item.id}>{item.original_name} · {item.category}</option>)}
                    </select>
                  </label>
                  <button className="button button-small mt-3" disabled={busy || !(stage === "before" ? beforeId : afterId)} onClick={() => void attachPhoto(stage)}>Attach {stage} photo</button>
                  <div className="mt-3 space-y-2">
                    {photoGroup(stage).map(photo => (
                      <div key={photo.project_photo_id} className="flex items-center gap-2 text-xs">
                        <img src={photo.url} alt="" className="h-12 w-16 object-cover" />
                        <span className="flex-1">{photo.original_name}</span>
                        <button className="text-orange underline" disabled={busy} onClick={() => void detachPhoto(photo.project_photo_id)}>Remove</button>
                      </div>
                    ))}
                    {photoGroup(stage).length === 0 && <p className="text-xs text-mist">No {stage} photographs attached.</p>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-mist">Photographs must first be uploaded in Media Library. Publishing the project also publishes its linked photographs. Check that you have permission to publish customer or property images.</p>
          </div> : <p className="p-4 text-sm text-mist">Select a project to attach photographs and manage publication status.</p>}
        </section>
      </div>
    </div>
  );
}
