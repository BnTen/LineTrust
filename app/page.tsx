import { HomeHero } from "@/components/home-hero";
import { getOdCoverage } from "@/lib/coverage";
import { getNetworkCatalog } from "@/lib/network";

export default async function Home() {
  const [catalog, coverage] = await Promise.all([
    getNetworkCatalog(),
    getOdCoverage(),
  ]);
  return <HomeHero catalog={catalog} coverage={coverage} />;
}
