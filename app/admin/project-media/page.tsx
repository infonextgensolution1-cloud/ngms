import Link from 'next/link'
import BeforeAfterUploader from '@/components/admin/BeforeAfterUploader'

export default function ProjectMediaPage() {
  return (
    <main className="min-h-screen bg-jet text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-white">← Dashboard</Link>
        <h1 className="text-3xl font-black mt-4">Project Media</h1>
        <p className="text-gray-400 mt-1 mb-8">Upload completed projects as 4 BEFORE + 4 AFTER photos.</p>
        <BeforeAfterUploader />
      </div>
    </main>
  )
}
