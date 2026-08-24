export const metadata = {
  title: 'Contact Us | NGMS',
  description: 'Get in touch with Next Gen Maintenance Solutions — Strand, Gordon’s Bay, Somerset West.',
}

export default function ContactPage() {
  return (
    <main className="bg-white text-black">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-orange font-bold text-sm uppercase tracking-wide mb-2">Get In Touch</p>
        <h1 className="text-4xl sm:text-6xl font-black">Contact NGMS</h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto mt-4">
          One call for all your property maintenance needs across the Helderberg Basin.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-14 grid sm:grid-cols-2 gap-6 text-center">
        <a
          href="https://wa.me/27631387945"
          className="border border-gray-200 rounded-2xl p-8 hover:border-orange transition"
        >
          <p className="font-bold text-lg mb-1">WhatsApp</p>
          <p className="text-gray-700 text-sm">063 138 7945</p>
        </a>
        <a
          href="tel:+27631387945"
          className="border border-gray-200 rounded-2xl p-8 hover:border-orange transition"
        >
          <p className="font-bold text-lg mb-1">Call</p>
          <p className="text-gray-700 text-sm">063 138 7945</p>
        </a>
        <a
          href="mailto:info.nextgensolution1@gmail.com"
          className="border border-gray-200 rounded-2xl p-8 hover:border-orange transition sm:col-span-2"
        >
          <p className="font-bold text-lg mb-1">Email</p>
          <p className="text-gray-700 text-sm">info.nextgensolution1@gmail.com</p>
        </a>
      </section>

      <section className="bg-graphite text-white text-center py-10 px-4">
        <p className="text-gray-300 text-lg mb-4">Serving Strand, Gordon’s Bay, Somerset West and the Helderberg Basin</p>
        <a href="/quote" className="bg-orange hover:bg-orange-dark text-white font-bold px-6 py-3 rounded-full inline-block">
          Get a Free Quote
        </a>
      </section>
    </main>
  )
}
