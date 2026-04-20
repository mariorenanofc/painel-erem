import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Educacional",
  description: "Plataforma gamificada de gestão de alunos, acompanhamento de missões e ranking.",
  metadataBase: new URL("https://painel-erem.vercel.app"),

  // Configuração do Open Graph (Para WhatsApp, Facebook, Telegram, etc)
  openGraph: {
    title: "Portal do Aluno | Área Restrita",
    description: "Acesse suas missões, XP, ranking e muito mais.",
    type: "website",
    url: "https://painel-erem.vercel.app",
    images: [
      {
        // ⚠️ USAR A URL ABSOLUTA RESOLVE 99% DOS BUGS DE COMPARTILHAMENTO
        url: "https://painel-erem.vercel.app/img-share.png",
        width: 1200,
        height: 630,
        alt: "Imagem de visualização do Portal Educacional",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}