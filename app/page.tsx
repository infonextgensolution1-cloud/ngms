export default function HomePage() {
  return (
    <main>
      <section className="bg-hero-gradient min-h-[90vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-xs tracking-[0.2em] text-gray-400 uppercase mb-4">
          Next Gen Maintenance Solutions
        </p>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight">
          <span className="text-white">ONE CALL.</span>
          <br />
          <span className="bg-headline-gradient bg-clip-text text-transparent">ALL SOLUTIONS.</span>
        </h1>
        <p className="max-w-xl text-gray-300 mt-6 mb-8">
          From maintenance and repairs to specialist services and property improvement
          projects — NGMS provides one coordinated solution for your property.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <a
            href="/quote"
            className="bg-orange hover:bg-orange-dark text-white font-semibold px-6 py-3 rounded-full"
          >
            GET A FREE QUOTE
          </a>
          <a
            href="https://wa.me/27631387945"
            className="border border-white text-white font-semibold px-6 py-3 rounded-full"
          >
            WHATSAPP NGMS
          </a>
        </div>
        <p className="text-xs tracking-widest text-gray-500 uppercase mt-8">
          Serving Strand · Somerset West · Gordon's Bay · Helderberg Basin
        </p>
      </section>

      <div className="bg-orange text-white text-center text-sm font-semibold py-2">
        10% OFF your first booking · Solar panel cleaning from R50/panel
      </div>

      <section className="bg-white text-black py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-purple">12</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Trade Services</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple">100%</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Helderberg-Based</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple">1</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Point of Contact</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple">7</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Step Process</p>
          </div>
        </div>
      </section>

      <section className="bg-white text-black py-10 text-center">
        <p className="text-orange font-semibold text-sm mb-2">WHAT WE DO</p>
        <h2 className="text-2xl sm:text-3xl font-black">EVERYTHING YOUR PROPERTY NEEDS</h2>
        {/* Service grid goes here — see /services page */}
      </section>
    </main>
  )
}
