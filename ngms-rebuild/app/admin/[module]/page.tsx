import { notFound } from "next/navigation";
import AdminModuleClient, { type AdminModuleKey } from "@/components/AdminModuleClient";

const allowedModules: AdminModuleKey[] = [
  "enquiries", "jobs", "quotes", "invoices", "calendar", "media", "content", "reports", "settings",
];

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!allowedModules.includes(module as AdminModuleKey)) notFound();
  return <AdminModuleClient moduleKey={module as AdminModuleKey} />;
}
