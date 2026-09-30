import { FAQS } from '@/lib/faqs'

export const metadata = {
  title: 'FAQ | NextGen Solar Clean & Maintenance Solutions',
  description: 'Frequently asked questions about NextGen Solar Clean & Maintenance Solutions services, pricing and areas served.',
}

export default function FaqPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-orange font-bold text-sm uppercase tracking-wide mb-2 font-heading">Questions</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Frequently asked questions</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Everything we get asked most about pricing, areas and how we work.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          {FAQS.map((item) => (
            <details key={item.q} className="bg-cardgrey border border-darkgrey rounded-card p-5 group">
              <summary className="font-heading font-semibold text-paper cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-orange ml-4 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-mist mt-3 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-jet text-white text-center py-14 px-4">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Still have a question?</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <a href="https://wa.me/27631387945" className="btn-wa">
            WhatsApp us
          </a>
          <a href="/contact" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-orange hover:text-orange">
            Contact us
          </a>
        </div>
      </section>
    </main>
  )
}
