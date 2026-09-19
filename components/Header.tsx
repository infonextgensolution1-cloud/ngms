import Link from "next/link";
import Image from "next/image";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/gallery", label: "Gallery" },
  { href: "/prices", label: "Catalog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-jet border-b border-line">
      <div className="wrap flex items-center justify-between gap-3 py-2">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="NextGen Solar & Maintenance Solutions" width={44} height={38} />
          <span className="leading-tight">
            <span className="block">
              <span className="font-display text-blue text-lg tracking-wide">NextGen</span>{" "}
              <span className="font-display text-orange text-lg">Solar</span>
            </span>
            <span className="block text-mist text-[10px] tracking-[0.14em] uppercase -mt-0.5">
              &amp; Maintenance Solutions
            </span>
          </span>
        </Link>
        <nav className="hidden md:flex gap-5 font-display uppercase font-semibold text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-mist hover:text-orange transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/quote" className="btn hidden sm:inline-block">
            Get A Quote
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <details className="md:hidden relative">
      <summary className="list-none w-11 h-11 grid place-items-center border border-line rounded-lg text-paper cursor-pointer select-none">
        <span aria-hidden>☰</span>
        <span className="sr-only">Menu</span>
      </summary>
      <div className="absolute right-0 top-[52px] w-64 bg-graphite border border-line rounded-lg overflow-hidden shadow-xl">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-3 border-b border-line font-display uppercase text-mist hover:text-orange"
          >
            {item.label}
          </Link>
        ))}
        <Link href="/quote" className="block px-4 py-3 text-center bg-wa text-white font-display uppercase font-semibold">
          Get Free Quote
        </Link>
      </div>
    </details>
  );
}
