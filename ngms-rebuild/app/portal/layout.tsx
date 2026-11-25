import type {ReactNode} from "react";

export const metadata={
  title:"NGMS Customer Portal",
  robots:{index:false,follow:false},
};

export default function CustomerPortalLayout({children}:{children:ReactNode}){
  return children;
}
