import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.legalName,
    short_name: site.name,
    description:
      "שלושה דורות של מומחיות בשמאות מקרקעין — היטל השבחה, ירידת ערך, הפקעות וחוות דעת מומחה.",
    start_url: "/",
    display: "standalone",
    lang: "he",
    dir: "rtl",
    background_color: "#0a1e3f",
    theme_color: "#0a1e3f",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
