"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LandingPageProps {
  onLoginTutor: () => void;
}

export default function LandingPage({ onLoginTutor }: LandingPageProps) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  if (!montado) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decorativo */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full aurora-bg-blob-1 animate-float-slow pointer-events-none opacity-50 dark:opacity-30" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full aurora-bg-blob-2 animate-float-medium pointer-events-none opacity-50 dark:opacity-30" />
      <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full aurora-bg-blob-3 animate-glow-pulse pointer-events-none opacity-50 dark:opacity-30" />

      {/* Top Navbar */}
      <nav className="relative z-20 flex justify-between items-center p-6 md:px-12 max-w-7xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
            🚀
          </div>
          <span className="font-display font-black text-xl tracking-tight text-slate-800 dark:text-white">
            Portal Trilhatech PFT
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 md:gap-4"
        >
          <button
            onClick={onLoginTutor}
            className="cursor-pointer text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors px-3 py-2 uppercase tracking-wider"
          >
            Acesso Restrito
          </button>
          <button
            onClick={() => window.location.href = "/portal"}
            className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-650 hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>🎮</span> Portal do Aluno
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start p-6 text-center max-w-6xl mx-auto w-full pt-12 md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", damping: 20 }}
          className="space-y-6 w-full"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
            Sistema Integrado de Gestão Escolar Open Source
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] text-slate-900 dark:text-white max-w-4xl mx-auto">
            Engajamento e Inovação <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Pedagógica</span> em uma Única Plataforma.
          </h1>
          
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed mt-6">
            O Portal Trilhatech PFT é um ecossistema educacional projetado para mitigar ruídos de comunicação, centralizar dados acadêmicos e promover o engajamento contínuo dos estudantes através de metodologias ativas e tecnologia.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 pt-4 mb-16">
            <button
              onClick={() => window.location.href = "/portal"}
              className="cursor-pointer bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
            >
              Acessar Ambiente Virtual
            </button>
            <button
              onClick={() => window.open("https://github.com/mariorenanofc/painel-erem", "_blank")}
              className="cursor-pointer glass-panel bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105 active:scale-95 border border-slate-200 dark:border-white/10 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>⭐</span> Repositório Oficial
            </button>
          </div>

          {/* Hero Mockup (Real Image) */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-brand-primary/20 relative"
          >
            <img src="/real-aluno-1.png" alt="Painel do Estudante - Portal Trilhatech PFT" className="w-full h-auto object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60"></div>
          </motion.div>
        </motion.div>

        {/* Section: Contexto Histórico e Justificativa (PFT & CESAR) */}
        <section className="mt-32 w-full text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 text-orange-700 dark:text-orange-400 text-xs font-black uppercase tracking-widest mb-2">
                As Raízes do Projeto
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white flex items-center gap-3">
                <span className="text-4xl">🌱</span> O Desafio do Florescendo Talentos
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                A concepção da plataforma originou-se da necessidade de solucionar falhas de comunicação e otimizar fluxos de dados acadêmicos para o <strong>Projeto Florescendo Talentos (PFT)</strong>, uma iniciativa do <strong>CESAR</strong> (Centro de Estudos e Sistemas Avançados do Recife).
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                O PFT visa qualificar estudantes da rede pública (Ensino Médio e EJA) no curso de <em>"Operador de Computador com Ênfase em Desenvolvimento de Sistemas Web"</em>. Acompanhar as entregas de código e manter os alunos engajados de forma descentralizada era um desafio imenso para o corpo docente.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                Foi então que o <strong>Portal Trilhatech PFT</strong> adotou o modelo de <em>Metodologias Ativas e Gamificação</em>, estabelecendo dinâmicas de mérito que resultaram na plena automatização dos processos avaliativos e num aumento expressivo no engajamento dos alunos.
              </p>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-center md:justify-end"
            >
              <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 relative flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-orange-500/10 w-full max-w-lg justify-center overflow-hidden">
                 
                 {/* Decorative background glow */}
                 <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl -translate-y-1/2"></div>
                 <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -translate-y-1/2"></div>

                 {/* Portal Trilhatech Side */}
                 <div className="flex flex-col items-center relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-brand-primary/40 transition-transform hover:scale-110 duration-300">
                      🚀
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="font-display font-black text-sm text-slate-800 dark:text-white">Portal Trilhatech</h3>
                    </div>
                 </div>

                 {/* Connection / Plus */}
                 <div className="text-brand-primary dark:text-brand-secondary font-black flex items-center relative z-10">
                    <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                 </div>

                 {/* PFT Side */}
                 <div className="flex flex-col items-center relative z-10">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 overflow-hidden transition-transform hover:scale-110 duration-300 bg-[#FAF9F0]">
                       <img src="/logo-pft.png" alt="Logo Florescendo Talentos" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="font-display font-black text-sm text-slate-800 dark:text-white">Florescendo Talentos</h3>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">By CESAR</p>
                    </div>
                 </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* Section: A Jornada do Estudante */}
        <section className="mt-32 w-full text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-2">
                Experiência Discente
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white">
                Acompanhamento Pedagógico e Motivação Contínua
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                O ambiente virtual foi desenhado para incentivar a autonomia do estudante. Através de indicadores visuais de progressão, o aluno acompanha em tempo real suas devolutivas, pendências acadêmicas e sua classificação de desempenho em relação à turma.
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <strong className="text-slate-800 dark:text-white">Indicadores de Mérito:</strong>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Conquistas (badges) são atribuídas por metas alcançadas, como assiduidade perfeita ou entregas dentro do prazo, fomentando uma comunidade de aprendizado ativa e colaborativa.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">💻</span>
                  <div>
                    <strong className="text-slate-800 dark:text-white">Avaliação Prática (Miniprojetos):</strong>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Integração de testes práticos de codificação, onde falhas sintáticas ou lógicas resultam em decréscimo de pontuação, instigando o rigor técnico e a atenção aos detalhes por parte do estudante.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Real Student Image (Hall of fame / Profile) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-blue-500/20 relative"
            >
              <img src="/real-aluno-4.png" alt="Perfil Público e Conquistas" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-60"></div>
            </motion.div>
          </div>
        </section>

        {/* Section: Visão do Tutor */}
        <section className="mt-32 w-full text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* Real Tutor Image */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl shadow-emerald-500/20 order-2 md:order-1 relative"
            >
              <img src="/real-tutor-1.png" alt="Painel Administrativo do Tutor" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-60"></div>
            </motion.div>

            <div className="space-y-6 order-1 md:order-2">
              <div className="inline-block px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 text-purple-700 dark:text-purple-400 text-xs font-black uppercase tracking-widest mb-2">
                Gestão Docente
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white">
                Controle Administrativo e Eficiência
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                Procedimentos burocráticos foram substituídos por rotinas sistêmicas. O painel centraliza a importação de alunos, monitoramento de desempenho e a estruturação de dados exigidos por instituições parceiras.
              </p>
              <ul className="space-y-4 mt-6">
                <li className="flex items-start gap-3">
                  <span className="text-xl">✅</span>
                  <div>
                    <strong className="text-slate-800 dark:text-white">Registro Eletrônico de Frequência:</strong>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">A chamada presencial é convertida em um modelo de check-in digital via senha rotativa. Os dados são estruturados automaticamente em relatórios formatados para auditoria escolar.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">☁️</span>
                  <div>
                    <strong className="text-slate-800 dark:text-white">Sincronização Integrada ao AVA:</strong>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">O sistema mapeia atividades lançadas no Google Classroom, audita as devolutivas dos alunos de forma autônoma e aplica os critérios avaliativos predefinidos no portal.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Missao Institucional */}
        <section className="mt-32 w-full text-center max-w-4xl mx-auto mb-20 bg-gradient-to-b from-transparent to-blue-500/5 dark:to-blue-500/10 p-12 rounded-[3rem] border border-slate-200 dark:border-white/5">
          <div className="text-5xl mb-6">🏛️</div>
          <h2 className="text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white mb-6">
            Missão Institucional
          </h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xl font-medium">
            Capacitar educadores com ferramentas tecnológicas que maximizem o aproveitamento do tempo letivo, enquanto proporcionamos um ambiente de aprendizagem dinâmico e atrativo para os jovens. O objetivo fundamental vai além da métrica acadêmica: buscamos despertar o interesse pelas Ciências da Computação, inspirando os estudantes a transicionarem de meros usuários para <strong className="text-brand-primary">criadores de suas próprias soluções tecnológicas</strong>.
          </p>
        </section>

      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 p-6 text-center border-t border-slate-200 dark:border-white/5 mt-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Desenvolvido para o Futuro da Educação.
        </p>
      </footer>
    </div>
  );
}
