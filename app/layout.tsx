import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next Gen Maintenance Solutions | NGMS',
  description:
    'One call, all solutions. Property maintenance across Strand, Somerset West, Gordon’s Bay and the Helderberg Basin.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white text-black sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3 gap-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="NGMS logo" className="h-9 w-auto" />
              <div>
                <div className="font-bold text-sm tracking-tight">NEXT GEN</div>
                <div className="text-[10px] font-semibold text-silver tracking-wide">MAINTENANCE SOLUTIONS</div>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
              <Link href="/services" className="hover:text-orange">Services</Link>
              <Link href="/portfolio" className="hover:text-orange">Our Work</Link>
              <Link href="/price-list" className="hover:text-orange">Price List</Link>
              <Link href="/about" className="hover:text-orange">About</Link>
              <Link href="/contact" className="hover:text-orange">Contact</Link>
            </nav>
            <nav className="flex items-center gap-3">
              <a href="https://wa.me/27631387945" className="text-eco font-semibold text-sm hidden sm:inline">
                WHATSAPP
              </a>
              <Link
                href="/quote"
                className="bg-orange hover:bg-orange-dark text-white font-semibold text-xs px-4 py-2 rounded-full"
              >
                GET A QUOTE
              </Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="bg-jet text-gray-400 text-sm py-10 mt-10">
          <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 gap-8">
            <div>
              <p className="font-bold text-white mb-1">Next Gen Maintenance Solutions</p>
              <p>Strand · Gordon’s Bay · Somerset West · Helderberg Basin</p>
              <p className="mt-2">
                063 138 7945 · info.nextgensolution1@gmail.com
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              <Link href="/services" className="hover:text-white">Services</Link>
              <Link href="/portfolio" className="hover:text-white">Our Work</Link>
              <Link href="/price-list" className="hover:text-white">Price List</Link>
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
