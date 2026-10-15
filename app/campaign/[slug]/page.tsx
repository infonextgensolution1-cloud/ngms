import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import { getCampaignConfig, getCampaignService, campaignConfigs } from "@/lib/campaigns";
import { getGalleryPhotos, getServiceImages } from "@/lib/queries";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import CampaignTracker from "@/components/campaign/CampaignTracker";

export const revalidate = 300;

export function generateStaticParams() {
  return Object.keys(campaignConfigs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const config = getCampaignConfig(slug);
  if (!config) return {};
  const service = getCampaignService(config.slug, services);
  if (!service) return {};
  return {
    title: `${service.metaTitle} | Campaign`,
    description: service.metaDescription,
    alternates: { canonical: `/campaign/${config.slug}` },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: `/campaign/${config.slug}`,
      type: "website",
    },
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = getCampaignConfig(slug);
  if (!config) notFound();

  const service = getCampaignService(config.slug, services);
  if (!service) notFound();

  const [serviceImages, gallery] = await Promise.all([
    getServiceImages(),
    getGalleryPhotos(48),
  ]);

  const proofPhotos = gallery.filter((photo) => photo.service_slug === service.slug && photo.image_url);
  const heroImage = serviceImages[service.slug] || proofPhotos[0]?.image_url;

  return (
    <>
      <CampaignTracker campaign={config.slug} />
      <CampaignLanding config={config} service={service} heroImage={heroImage} proofPhotos={proofPhotos} />
    </>
  );
}
