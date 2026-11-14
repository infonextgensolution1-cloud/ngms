import type {ReactNode} from "react";
import {redirect} from "next/navigation";
import {AdminShell} from "@/components/AdminShell";
import {getSessionUser} from "@/lib/server/auth";

export const metadata={title:"NGMS Business Control",robots:{index:false,follow:false}};

export default async function AdminLayout({children}:{children:ReactNode}){
  const user=await getSessionUser();
  if(!user) redirect("/login");
  return <AdminShell>{children}</AdminShell>;
}
