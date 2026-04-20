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
  title: "Portal Trilha Tech",
  description:
    "Verificação de dados e gestão de alunos da EREM Barão do Exu - Pernambuco",
  metadataBase: new URL("https://painel-erem.vercel.app/"),

  //Configuração do Open Graph
  openGraph: {
    title: "Portal do Aluno - Trilha Tech",
    description:
      "Acesse suas missões, XP, ranking e muito mais. Entre para o Trilha Tech!",
    type: "website",
    url: "/portal",
    images: [
      {
        // A URL completa da imagem (deve ser um link público e acessível)
        url: "https://painel-erem.vercel.app/img-share.png",
        // Largura e altura sugeridas para o preview (1200x630 é o padrão ideal)
        width: 1200,
        height: 630,
        alt: "Imagem de visualização do Portal do Aluno Trilha Tech",
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
