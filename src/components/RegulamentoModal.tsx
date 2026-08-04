"use client";

import { motion, AnimatePresence } from "framer-motion";

interface RegulamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegulamentoModal({ isOpen, onClose }: RegulamentoModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/65 backdrop-blur-md"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="glass-panel-heavy bg-white/95 dark:bg-slate-900/95 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-slate-200/80 dark:border-white/5 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col relative z-10"
        >
          {/* Top glow decoration */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[90px] -mr-36 -mt-36 pointer-events-none" />

          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-emerald-650 to-teal-800 dark:from-emerald-700 dark:to-teal-900 p-5 flex justify-between items-center text-white shrink-0 relative border-b border-white/5">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-display font-black text-lg md:text-xl flex items-center gap-2 tracking-tight">
                <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-sm shadow-inner">
                  📜
                </span>{" "}
                Regulamento - Regras do Jogo
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5 opacity-90">
                Entenda o sistema de pontuação, rankings, ofensivas e premiações
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white text-xl transition-colors duration-200 shadow-sm"
            >
              &times;
            </button>
          </div>

          {/* Conteúdo Rolável */}
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-slate-700 dark:text-slate-300">
            {/* Seção 1: Pontuação e Atividades */}
            <section className="space-y-3">
              <h3 className="font-display font-black text-slate-900 dark:text-white text-sm md:text-base flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>🎯</span> 1. Pontuação e Atividades
              </h3>
              <p className="text-xs md:text-sm leading-relaxed">
                Cada atividade ou missão possui um valor de XP (Experiência) base. Para garantir seus pontos, fique atento aos prazos e regras de envio:
              </p>
              <ul className="list-disc pl-5 text-xs md:text-sm space-y-1.5">
                <li>
                  <strong className="text-emerald-600 dark:text-emerald-400">Entregas no Prazo:</strong> Garantem a pontuação máxima estipulada para a atividade (ex: Desafio = 25 XP, Miniprojeto = 150 XP).
                </li>
                <li>
                  <strong className="text-amber-500">Desconto de Atraso:</strong> Para entregas após o prazo, aplica-se uma redução de <strong>1 XP por dia de atraso</strong>.
                </li>
                <li>
                  <strong className="text-red-500">Desconto de Gabarito:</strong> Se a atividade for enviada após a liberação do gabarito oficial pelo tutor, haverá uma dedução adicional de <strong>30% do valor total</strong> da atividade.
                </li>
                <li>
                  <strong>Piso de XP (Garantia Mínima):</strong> Mesmo com atrasos acumulados, qualquer resposta correta enviada receberá no mínimo <strong>10% do valor original</strong> da atividade (não zera completamente).
                </li>
                <li>
                  <strong>Módulos Encerrados:</strong> Se o módulo correspondente da atividade já tiver sido fechado no diário da turma, ela renderá <strong>0 XP</strong>.
                </li>
              </ul>
            </section>

            {/* Seção 2: Validação */}
            <section className="space-y-3">
              <h3 className="font-display font-black text-slate-900 dark:text-white text-sm md:text-base flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>🤖</span> 2. Processo de Validação
              </h3>
              <p className="text-xs md:text-sm leading-relaxed">
                As atividades são validadas de duas formas dependendo da configuração:
              </p>
              <ul className="list-disc pl-5 text-xs md:text-sm space-y-1.5">
                <li>
                  <strong>Autogestão / Quizzes:</strong> São avaliados e corrigidos automaticamente pelo portal no momento do envio.
                </li>
                <li>
                  <strong>Sincronização com AVA/Classroom:</strong> Atividades que requerem entrega no Google Classroom são processadas e importadas periodicamente pelo painel. Não é necessário reenviar no portal se já foi entregue no Classroom.
                </li>
              </ul>
            </section>

            {/* Seção 3: Rankings */}
            <section className="space-y-3">
              <h3 className="font-display font-black text-slate-900 dark:text-white text-sm md:text-base flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>🏆</span> 3. Rankings e a Regra Antiacúmulo
              </h3>
              <p className="text-xs md:text-sm leading-relaxed">
                Existem três tipos de placares na plataforma:
              </p>
              <ul className="list-disc pl-5 text-xs md:text-sm space-y-1.5">
                <li>
                  <strong>Ranking Geral:</strong> Acumula toda a experiência (XP) vitalícia do estudante, definindo o nível do seu perfil (Iniciante, Bronze, Prata, Ouro, Diamante, etc.).
                </li>
                <li>
                  <strong>Ranking Semanal e Mensal:</strong> Mede o engajamento e a assiduidade recente dos alunos no período corrente.
                </li>
              </ul>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/35 rounded-xl text-xs md:text-sm space-y-2">
                <p className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  ⚠️ Regra de Equidade de Placar (Antiacúmulo):
                </p>
                <p className="leading-relaxed">
                  Para evitar que alunos deixem acumular dezenas de tarefas para entregar tudo de uma vez no final da semana/mês e distorçam o ranking, aplica-se um teto (cap) de pontos atrasados:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>O XP vindo de <strong>atividades atrasadas sem justificativa</strong> é limitado a um teto máximo de <strong>50 XP por semana</strong> no Ranking Semanal (e <strong>150 XP por mês</strong> no Ranking Mensal).</li>
                  <li>
                    <strong className="text-emerald-700 dark:text-emerald-450">Isenção por Falta Justificada:</strong> Se você tiver uma <strong>falta justificada</strong> oficial registrada na data limite original da atividade, ela fica totalmente <strong>isenta</strong> da trava! O XP do atraso contará integralmente (100%) no seu ranking daquela semana.
                  </li>
                </ul>
              </div>
            </section>

            {/* Seção 4: Ofensivas */}
            <section className="space-y-3">
              <h3 className="font-display font-black text-slate-900 dark:text-white text-sm md:text-base flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>🔥</span> 4. Ofensivas de Frequência (Streak)
              </h3>
              <p className="text-xs md:text-sm leading-relaxed">
                A Ofensiva representa a sua constância nas aulas da trilha:
              </p>
              <ul className="list-disc pl-5 text-xs md:text-sm space-y-1.5">
                <li>
                  Cada dia de aula que você comparece e realiza o check-in no portal adiciona <strong>+1 dia</strong> de ofensiva.
                </li>
                <li>
                  <strong>Faltas Não Justificadas:</strong> Caso ocorra uma aula da sua turma onde você não registre presença e nem apresente justificativa, a sua ofensiva <strong>reseta para 1</strong>.
                </li>
                <li>
                  <strong>Faltas Justificadas:</strong> Presenças justificadas (com atestado entregue ao tutor) são consideradas seguras (<span className="text-emerald-600 dark:text-emerald-400 font-bold">streak-safe</span>). Elas mantêm e protegem a sua sequência de ofensiva ativa!
                </li>
              </ul>
            </section>

            {/* Seção 5: Loja e Sorteios */}
            <section className="space-y-3">
              <h3 className="font-display font-black text-slate-900 dark:text-white text-sm md:text-base flex items-center gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>🎫</span> 5. Carteira, Loja de Rifas e Sorteios
              </h3>
              <p className="text-xs md:text-sm leading-relaxed">
                O XP acumulado na plataforma também atua como a sua <strong>moeda virtual</strong>:
              </p>
              <ul className="list-disc pl-5 text-xs md:text-sm space-y-1.5">
                <li>
                  Você pode abrir a <strong>Loja</strong> no portal e usar o saldo da sua carteira para adquirir bilhetes de rifa para os sorteios promovidos no projeto.
                </li>
                <li>
                  Comprar bilhetes debita o valor em moedas (XP) da sua carteira, mas <span>não diminui</span> seu nível nem seu XP acumulado no histórico geral!
                </li>
                <li>
                  Fique atento ao sorteio no final do ano anunciado pelo tutor para verificar se seus números comprados foram sorteados!
                </li>
              </ul>
            </section>
          </div>

          {/* Rodapé Fixo */}
          <div className="p-6 pt-0 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/30 dark:bg-transparent shrink-0">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="cursor-pointer w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3  rounded-2xl font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all select-none shadow-md"
            >
              Compreendi as Regras
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
