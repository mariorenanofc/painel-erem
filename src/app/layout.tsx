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
  const anoAtual = new Date().getFullYear();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* 🔥 SCRIPT MÁGICO DO THEMA: Evita o "piscar" (FOUC) ao carregar a página */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      {/* Adicionamos a transição suave de cores no body e o suporte ao dark mode */}
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* FOOTER GLOBAL ATUALIZADO PARA DARK MODE */}
        <footer className="w-full py-4 px-4 text-center text-[11px] md:text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          &copy; {anoAtual} |{" Desenvolvido por "}
          <a 
            href="https://mariorenanofc.com.br" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Tutor Mário Renan - PFT 🌵
          </a>
        </footer>

      </body>
    </html>
  );
}