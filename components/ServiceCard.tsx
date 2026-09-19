import Link from "next/link";
import type { Service } from "@/lib/services";

export default function ServiceCard({ s }: { s: Service }) {
  return (
    <Link href={`/services/${s.slug}`} className="card block text-left">
      <h3 className="text-lg">{s.name}</h3>
      <p className="tag">{s.tag}</p>
      <p className="text-mist text-sm mt-2">{s.price}</p>
    </Link>
  );
}
