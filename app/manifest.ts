import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BiiG OS",
    short_name: "BiiG",
    description: "Weekly networking operations for BiiG.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B54A3",
    icons: [
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
