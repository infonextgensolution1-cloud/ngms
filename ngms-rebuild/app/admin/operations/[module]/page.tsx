import {notFound} from "next/navigation";
import OperationsModuleClient from "@/components/OperationsModuleClient";

const modules=["suppliers","materials","purchases","expenses","staff","subcontractors","wages","maintenance"] as const;
type Module=(typeof modules)[number];

export default async function OperationsModulePage({params}:{params:Promise<{module:string}>}){
 const {module}=await params;
 if(!modules.includes(module as Module))notFound();
 return <OperationsModuleClient category={module as Module}/>;
}
