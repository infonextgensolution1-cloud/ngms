import { supabase } from '@/lib/supabaseClient'

export const metadata = {
  title: 'Gallery | NGSMS',
  description: 'Photos from NextGen Solar & Maintenance Solutions jobs across the Helderberg Basin.',
}

export const revalidate = 0

type GalleryPhoto = {
  id: string
  image_url: string
  caption: string | null
  service_slug: string | null
}

async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return (data as GalleryPhoto[]) ?? []
}

export default async function GalleryPage() {
  const photos = await getGalleryPhotos()

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
        {photos.length > 0 ? (
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="aspect-square bg-cardgrey border border-darkgrey rounded-card overflow-hidden relative group">
                <img src={photo.image_url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
                {photo.caption && (
                  <p className="absolute bottom-0 left-0 right-0 bg-jet/80 text-paper text-xs p-2">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
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
          </>
        )}
      </section>
    </main>
  )
}
