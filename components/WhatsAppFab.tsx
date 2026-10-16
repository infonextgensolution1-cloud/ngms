import { waLink } from "@/lib/site";

export default function WhatsAppFab() {
  return (
    <a
      className="fixed right-5 bottom-5 z-40 grid h-16 w-16 place-items-center rounded-full border-2 border-[#ff3030] bg-transparent text-white shadow-[0_0_18px_rgba(255,48,48,0.22)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_24px_rgba(255,48,48,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-black"
      href={waLink("Hi NextGen — I'd like a quote.")}
      aria-label="Contact NextGen on WhatsApp"
      title="Chat with NextGen on WhatsApp"
      target="_blank"
      rel="noreferrer"
    >
      <svg
        viewBox="0 0 24 24"
        width="36"
        height="36"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2a10 10 0 0 0-8.65 14.94L2 22l5.2-1.36A10 10 0 1 0 12 2Zm5.77 14.36c-.24.68-1.4 1.25-1.94 1.3-.5.04-1.13.08-1.82-.11-.42-.12-.96-.31-1.65-.61-2.9-1.26-4.78-4.2-4.93-4.4-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.7-.42 1.12-.42.14 0 .26 0 .37.01.33.01.49.03.7.54l.86 2.1c.09.2.11.37.02.58-.1.21-.14.34-.3.52-.14.16-.3.36-.43.48-.14.14-.28.29-.12.56.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.2.7-.81.89-1.09.19-.28.38-.23.64-.14.26.09 1.67.79 1.96.93.28.14.47.21.54.33.07.12.07.68-.17 1.36Z" />
      </svg>
    </a>
  );
}
