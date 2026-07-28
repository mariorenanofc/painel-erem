import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portal TrilhaTech",
    short_name: "TrilhaTech",
    description: "Plataforma gamificada do Portal TrilhaTech - EREM Barão do Exu",
    start_url: "/",
    display: "standalone",
    background_color: "#030712", // Corresponde ao slate-950 (Fundo Escuro)
    theme_color: "#6366f1",      // Corresponde ao brand-primary (Indigo)
    icons: [
      {
        src: "/favicon.ico?v=2",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon.png?v=2",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png?v=2",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
