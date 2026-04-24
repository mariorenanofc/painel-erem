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

  // CONFIGURAÇÃO DO OPEN GRAPH
  openGraph: {
    title: "Portal Educacional | Área Restrita",
    description: "Acesse suas missões, XP, ranking e muito mais.",
    type: "website",
    url: "https://painel-erem.vercel.app",
    images: [
      {
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
  // Pega o ano atual dinamicamente direto do servidor
  const anoAtual = new Date().getFullYear();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        
        {/* O conteúdo das páginas (children) cresce para ocupar o espaço disponível */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* FOOTER GLOBAL - COERENTE COM O TEMA */}
        <footer className="w-full py-4 px-4 text-center text-[11px] md:text-xs text-slate-500 border-t border-slate-200 mt-auto bg-slate-50">
          &copy; {anoAtual} |{" Desenvolvido por "}
          <a 
            href="https://mariorenanofc.com.br" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-black text-blue-600 hover:text-blue-800 transition-colors"
          >
            Tutor Mário Renan - PFT 🌵
          </a>
        </footer>

      </body>
    </html>
  );
}