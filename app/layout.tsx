import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next Gen Maintenance Solutions | NGMS',
  description:
    'One call, all solutions. Property maintenance across Strand, Somerset West, Gordon\'s Bay and the Helderberg Basin.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white text-black">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div>
                <div className="font-bold text-sm tracking-tight">NEXT GEN</div>
                <div className="text-[10px] font-semibold text-silver tracking-wide">MAINTENANCE SOLUTIONS</div>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <a href="https://wa.me/27631387945" className="text-eco font-semibold text-sm hidden sm:inline">
                WHATSAPP
              </a>
              <a
                href="/quote"
                className="bg-orange hover:bg-orange-dark text-white font-semibold text-xs px-4 py-2 rounded-full"
              >
                GET A QUOTE
              </a>
            </nav>
          </div>
        </header>

        {children}

        <footer className="bg-jet text-gray-400 text-sm py-10 mt-10">
          <div className="max-w-6xl mx-auto px-4">
            <p className="font-bold text-white mb-1">Next Gen Maintenance Solutions</p>
            <p>Strand · Gordon's Bay · Somerset West · Helderberg Basin</p>
            <p className="mt-2">
              063 138 7945 · info.nextgensolution1@gmail.com
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
