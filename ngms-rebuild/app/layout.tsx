import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata:Metadata = {title:{default:"NGMS | One Call. All Solutions.",template:"%s | NGMS"},description:"Solar panel cleaning and property maintenance across Strand, Gordon's Bay, Somerset West and surrounding Western Cape areas.",metadataBase:new URL("https://www.nextgensolarmaintenance.co.za"),robots:{index:false,follow:false}};
export const viewport:Viewport = {width:"device-width",initialScale:1,themeColor:"#0A0A0A"};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en-ZA"><body>{children}</body></html>;}
