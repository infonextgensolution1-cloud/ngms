import { MapPin, ShieldCheck, Phone } from 'lucide-react'

export default function AboutSection() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-orange font-semibold text-sm uppercase tracking-wide mb-2">
        About NGSMS
      </p>
      <h2 className="text-3xl sm:text-4xl font-black mb-8">
        One contractor. Twelve trades. Local.
      </h2>

      {/* Owner block */}
      <div className="border-2 border-orange rounded-xl bg-graphite p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Photo placeholder — drop a file at /public/team/jacques.jpg */}
          <div className="w-32 h-32 shrink-0 rounded-xl overflow-hidden bg-jet border border-gray-700 relative">
            <img
              src="/team/jacques.jpg"
              alt="Jacques Gordon, Owner"
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs text-center px-2 pointer-events-none">
              Photo
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Jacques Gordon</h3>
            <p className="text-orange text-sm font-semibold mb-3">
              Owner &amp; Project Manager
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              I started NGSMS because property owners in the Helderberg were tired of
              chasing five different contractors for one job. Before this I ran
              maintenance for a pool company and worked as a construction foreman, so
              I know what good work looks like and what corners people cut. Today I
              quote every job, manage every site and stay the single point of contact
              from first call to final invoice — whether it&apos;s a solar clean in
              Strand or a full exterior repaint in Somerset West.
            </p>
          </div>
        </div>
      </div>

      {/* Supporting blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border-2 border-orange rounded-xl bg-graphite p-5">
          <MapPin className="w-6 h-6 text-orange mb-3" strokeWidth={1.5} />
          <h4 className="font-bold text-white mb-1">Helderberg-based</h4>
          <p className="text-sm text-gray-400">
            Strand, Gordon&apos;s Bay and Somerset West. No callout fee inside the
            basin — we&apos;re already here.
          </p>
        </div>

        <div className="border-2 border-orange rounded-xl bg-graphite p-5">
          <ShieldCheck className="w-6 h-6 text-orange mb-3" strokeWidth={1.5} />
          <h4 className="font-bold text-white mb-1">Quoted properly</h4>
          <p className="text-sm text-gray-400">
            Free site assessment, written quote, no obligation. Exterior work
            rescheduled free if the Cape weather turns.
          </p>
        </div>

        <div className="border-2 border-orange rounded-xl bg-graphite p-5">
          <Phone className="w-6 h-6 text-orange mb-3" strokeWidth={1.5} />
          <h4 className="font-bold text-white mb-1">One point of contact</h4>
          <p className="text-sm text-gray-400">
            You deal with me, not a call centre. WhatsApp 063 138 7945 and you get a
            real answer.
          </p>
        </div>
      </div>
    </section>
  )
}
