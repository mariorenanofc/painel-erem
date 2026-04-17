"use client";

import { PerfilAluno } from "../types";
import BadgesGallery from "./BadgesGallery";

interface PerfilModalProps {
  dadosPerfil: PerfilAluno | null;
  carregando: boolean;
  salvando: boolean;
  onClose: () => void;
  onSalvar: (dadosAtualizados: PerfilAluno) => void;
  setDadosPerfil: (dados: PerfilAluno) => void;
  // Dados extras para calcular as badges:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dadosBadges: any; 
}

export default function PerfilModal({ 
  dadosPerfil, carregando, salvando, onClose, onSalvar, setDadosPerfil, dadosBadges 
}: PerfilModalProps) {
  
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] select-text">
        
        <div className="bg-blue-900 p-5 border-b flex justify-between items-center text-white shrink-0">
          <h2 className="font-bold text-xl flex items-center gap-2"><span>👤</span> Meu Perfil e Conquistas</h2>
          <button onClick={onClose} className="text-3xl leading-none hover:text-blue-200 transition-colors">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {carregando ? (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div></div>
          ) : dadosPerfil ? (
            <>
              {/* Formulário de Dados */}
              <form onSubmit={(e) => { e.preventDefault(); onSalvar(dadosPerfil); }} className="space-y-4 bg-white">
                <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg border border-amber-200 mb-4 leading-relaxed">
                  <strong>Aviso de Segurança:</strong> Você tem permissão apenas para atualizar os seus números de telefone de contacto.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label><input type="text" value={dadosPerfil.nome} disabled className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Matrícula</label><input type="text" value={dadosPerfil.matricula} disabled className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed font-mono" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Nasc.</label><input type="text" value={dadosPerfil.dataNasc} disabled className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Turma Atual</label><input type="text" value={dadosPerfil.turma} disabled className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed" /></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div><label className="block text-xs font-bold text-blue-600 uppercase mb-1">Telefone (Seu)</label><input type="tel" value={dadosPerfil.telefoneAluno} onChange={(e) => setDadosPerfil({ ...dadosPerfil, telefoneAluno: e.target.value })} className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded-lg p-2.5 text-sm outline-none transition-colors" placeholder="(87) 9XXXX-XXXX" /></div>
                  <div><label className="block text-xs font-bold text-blue-600 uppercase mb-1">Telefone (Responsável)</label><input type="tel" value={dadosPerfil.telefoneResponsavel} onChange={(e) => setDadosPerfil({ ...dadosPerfil, telefoneResponsavel: e.target.value })} className="w-full bg-white border-2 border-blue-200 focus:border-blue-500 text-slate-800 rounded-lg p-2.5 text-sm outline-none transition-colors" placeholder="(87) 9XXXX-XXXX" /></div>
                </div>
                
                <div className="mt-2 flex justify-end">
                  <button type="submit" disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md disabled:bg-slate-400 transition-colors">
                    {salvando ? "Salvando..." : "Atualizar Contactos"}
                  </button>
                </div>
              </form>

              {/* A NOSSA NOVA GALERIA DE TROFÉUS AQUI! */}
              {dadosBadges && <BadgesGallery dados={dadosBadges} />}
              
            </>
          ) : (<p className="text-center text-red-500 font-bold py-8">Erro ao carregar dados do perfil.</p>)}
        </div>
      </div>
    </div>
  );
}