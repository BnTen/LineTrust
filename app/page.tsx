import { HomeHero } from "@/components/home-hero";
import { getNetworkCatalog } from "@/lib/network";

export default async function Home() {
  const catalog = await getNetworkCatalog();
  return <HomeHero catalog={catalog} />;
}
