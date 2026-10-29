export const site = {
  name: "NextGen Maintenance Solutions",
  shortName: "NGMS",
  tagline: "One Call. All Solutions.",
  domain: "https://www.nextgensolarmaintenance.co.za",
  phoneDisplay: "063 138 7945",
  phoneHref: "+27631387945",
  whatsappHref: "https://wa.me/27631387945?text=Hi%20NextGen%2C%20I%27d%20like%20a%20quote%20please.",
  serviceArea: "Strand, Gordon's Bay, Somerset West and surrounding Western Cape areas",
};
export type Service = { slug: string; name: string; tagline: string; description: string };
export const services: Service[] = [
  {slug:"solar-panel-cleaning",name:"Solar Panel Cleaning",tagline:"Keep every panel earning its keep.",description:"Share panel count, site location, access requirements and preferred timing so the scope can be reviewed."},
  {slug:"painting",name:"Painting",tagline:"Interior and exterior, done properly.",description:"Describe the property, surfaces, approximate area and preparation needs."},
  {slug:"waterproofing",name:"Waterproofing",tagline:"Stop leaks before they start.",description:"Identify the affected roof, wall or surface and any known water ingress."},
  {slug:"paving",name:"Paving",tagline:"Driveways, patios and walkways.",description:"Share approximate dimensions, current surface, site access and finish requirements."},
  {slug:"plumbing",name:"Plumbing",tagline:"Leaks, geysers, installations and repairs.",description:"Describe the issue, site location and any immediate constraints."},
  {slug:"electrical",name:"Electrical",tagline:"Safe, compliant electrical work.",description:"Explain the requested electrical work and any specific inspection or compliance requirements."},
  {slug:"pool-fibre-lining",name:"Pool Fibre Lining",tagline:"Restore your pool, don't replace it.",description:"Describe pool condition, approximate size and requested finish."},
  {slug:"high-pressure-cleaning",name:"High-Pressure Cleaning",tagline:"Driveways, walls, roofs and more.",description:"Describe the surface, approximate area and site conditions."},
  {slug:"rubble-removal",name:"Rubble Removal",tagline:"Site and garden clearance.",description:"Include material type, estimated volume and access conditions."},
  {slug:"steelwork-welding",name:"Steelwork & Welding",tagline:"Gates, railings and structural work.",description:"Provide the item, dimensions, finish and site requirements for assessment."},
  {slug:"handyman",name:"Handyman Services",tagline:"The small jobs, handled properly.",description:"List the tasks and include relevant details to establish the scope."},
  {slug:"subcontractor-work",name:"Subcontractor Work",tagline:"Trade support for other contractors.",description:"Include site location, trade scope, timing and site requirements."}
];
export const publicNav = [
  {href:"/services",label:"Services"},
  {href:"/maintenance-packages",label:"Maintenance plans"},
  {href:"/body-corporate-maintenance",label:"Body corporates"},
  {href:"/portfolio",label:"Projects"},
  {href:"/price-list",label:"Prices"},
  {href:"/contact",label:"Contact"}
];
