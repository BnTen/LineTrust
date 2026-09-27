import type { MetadataRoute } from "next";
import { isDataPublic } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  if (isDataPublic()) {
    return {
      rules: { userAgent: "*", allow: "/" },
    };
  }
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
