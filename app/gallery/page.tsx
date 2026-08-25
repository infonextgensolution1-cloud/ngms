export const metadata = {
  title: 'Gallery | NGSMS',
  description: 'Photos from NextGen Solar & Maintenance Solutions jobs across the Helderberg Basin.',
}

export default function GalleryPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Gallery</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Photos From The Field</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          General job and site photos — separate from our Projects (before &amp; after) page.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-cardgrey border border-darkgrey rounded-card flex items-center justify-center">
              <p className="text-mist text-xs uppercase tracking-wide font-heading text-center px-2">Photo coming soon</p>
            </div>
          ))}
        </div>
        <p className="text-center text-mist text-sm mt-8 opacity-70">
          Managed via the NGSMS admin dashboard — photos will appear here once uploaded.
        </p>
      </section>
    </main>
  )
}
