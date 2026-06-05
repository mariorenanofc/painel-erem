"use client";

import { GestaoFrequenciaModalProps } from "../types";

export default function GestaoFrequenciaModal(
  props: GestaoFrequenciaModalProps,
) {
  if (!props.isOpen) return null;

  const totalPresentes = props.dadosFreqHoje.filter(
    (a) => a.presenteHoje,
  ).length;
  const totalFaltantes = props.dadosFreqHoje.length - totalPresentes;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden transition-colors duration-300">
        {/* CABEÇALHO */}
        <div className="bg-emerald-700 dark:bg-emerald-900 text-white p-4 flex justify-between items-center transition-colors duration-300">
          <div className="flex items-center gap-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span>📍</span> Gestão de Frequência
            </h2>
            <div className="flex bg-emerald-800/50 dark:bg-emerald-950/50 rounded-lg p-1 transition-colors">
              <button
                onClick={() => props.setAbaDiario("mensal")}
                className={`cursor-pointer px-4 py-1.5 rounded-md text-sm font-bold transition-all ${props.abaDiario === "mensal" ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-sm" : "text-emerald-100 hover:text-white dark:hover:text-emerald-200"}`}
              >
                Visão Mensal
              </button>
              <button
                onClick={() => props.setAbaDiario("hoje")}
                className={`cursor-pointer px-4 py-1.5 rounded-md text-sm font-bold transition-all ${props.abaDiario === "hoje" ? "bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 shadow-sm" : "text-emerald-100 hover:text-white dark:hover:text-emerald-200"}`}
              >
                Frequência de Hoje
              </button>
            </div>
          </div>
          <button
            onClick={props.onClose}
            className="cursor-pointer text-3xl leading-none hover:text-emerald-200 dark:hover:text-emerald-400 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* FILTROS */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors duration-300">
          <div className="flex gap-3">
            <select
              value={props.turmaDiario}
              onChange={(e) => props.setTurmaDiario(e.target.value)}
              className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
            >
              <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
              <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
            </select>
            {props.abaDiario === "mensal" && (
              <>
                <select
                  value={props.mesDiario}
                  onChange={(e) => props.setMesDiario(e.target.value)}
                  className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                >
                  <option value="1">Janeiro</option>
                  <option value="2">Fevereiro</option>
                  <option value="3">Março</option>
                  <option value="4">Abril</option>
                  <option value="5">Maio</option>
                  <option value="6">Junho</option>
                  <option value="7">Julho</option>
                  <option value="8">Agosto</option>
                  <option value="9">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
                <select
                  value={props.anoDiario}
                  onChange={(e) => props.setAnoDiario(e.target.value)}
                  className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                >
                  <option value={new Date().getFullYear()}>
                    {new Date().getFullYear()}
                  </option>
                  <option value={new Date().getFullYear() + 1}>
                    {new Date().getFullYear() + 1}
                  </option>
                </select>
              </>
            )}
          </div>

          {props.abaDiario === "mensal" ? (
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-500/80"></span>{" "}
                Presente
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-500/80"></span>{" "}
                Falta
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500/80"></span>{" "}
                Justificada
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => props.setFiltroStatusHoje("Todos")}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-bold transition-all border ${props.filtroStatusHoje === "Todos" ? "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800 shadow-inner" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  Todos ({props.dadosFreqHoje.length})
                </button>
                <button
                  onClick={() => props.setFiltroStatusHoje("Presentes")}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-bold transition-all border ${props.filtroStatusHoje === "Presentes" ? "bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-800 shadow-inner" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  Presentes ({totalPresentes})
                </button>
                <button
                  onClick={() => props.setFiltroStatusHoje("Faltantes")}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-bold transition-all border ${props.filtroStatusHoje === "Faltantes" ? "bg-red-600 dark:bg-red-700 text-white border-red-700 dark:border-red-800 shadow-inner" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                >
                  Faltantes ({totalFaltantes})
                </button>
              </div>
              <div className="flex gap-2 items-center ml-2 border-l pl-4 border-slate-200 dark:border-slate-700 transition-colors">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Ordenar:
                </label>
                <select
                  value={props.ordenacaoFreq}
                  onChange={(e) =>
                    props.setOrdenacaoFreq(
                      e.target.value as "alfabetica" | "mais_faltas",
                    )
                  }
                  className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-2 text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                >
                  <option value="alfabetica">Ordem Alfabética</option>
                  <option value="mais_faltas">Mais Faltas</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* TABELAS */}
        <div className="p-0 flex-1 overflow-auto relative custom-scrollbar bg-white dark:bg-slate-900 transition-colors duration-300">
          {props.abaDiario === "mensal" ? (
            props.carregandoFreq ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <span className="text-4xl animate-bounce mb-3">📅</span>
                <p className="text-slate-600 dark:text-slate-400 font-bold transition-colors">
                  Processando Diário de Classe...
                </p>
              </div>
            ) : props.diasComAula.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12 transition-colors">
                Nenhuma aula registrada para esta turma neste mês.
              </p>
            ) : (
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-20 shadow-sm transition-colors">
                  <tr>
                    <th className="px-4 py-3 border-b border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-slate-100 dark:bg-slate-950 z-30 min-w-62 transition-colors">
                      Nome do Aluno
                    </th>
                    {props.diasComAula.map((dia) => (
                      <th
                        key={dia}
                        className="px-2 py-3 border-b border-slate-200 dark:border-slate-800 text-center min-w-15 transition-colors"
                        title={`Dia ${dia}`}
                      >
                        <div className="mx-auto text-slate-700 dark:text-slate-300 font-black transition-colors">
                          Dia {dia}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 transition-colors">
                  {props.alunosDiario.map((aluno) => (
                    <tr
                      key={aluno.matricula}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="px-4 py-3 border-b border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-10 font-bold text-slate-800 dark:text-slate-100 transition-colors">
                        <div className="truncate w-57">{aluno.nome}</div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-normal transition-colors">
                          {aluno.matricula}
                        </span>
                      </td>
                      {props.diasComAula.map((dia) => {
                        const infoDia = aluno.frequencia[dia];
                        return (
                          <td
                            key={dia}
                            className="px-2 py-2 border-b border-slate-100 dark:border-slate-800 text-center border-r md:border-slate-50 dark:md:border-slate-800/50 transition-colors"
                          >
                            {infoDia?.status === "presente" && (
                              <div
                                className="w-6 h-6 mx-auto bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded flex items-center justify-center font-bold text-xs transition-colors"
                                title="Presente"
                              >
                                P
                              </div>
                            )}
                            {infoDia?.status === "falta" && (
                              <div
                                onClick={() =>
                                  props.setModalJustificativaAberto({
                                    matricula: aluno.matricula,
                                    nome: aluno.nome,
                                    dia: dia,
                                    idFalta: infoDia?.idFalta,
                                  })
                                }
                                className="w-6 h-6 mx-auto bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-red-200 dark:hover:bg-red-900/60 hover:scale-110 transition-all shadow-sm"
                                title="Falta - Clique para justificar"
                              >
                                F
                              </div>
                            )}
                            {infoDia?.status === "justificada" && (
                              <div
                                onClick={() =>
                                  props.setModalJustificativaAberto({
                                    matricula: aluno.matricula,
                                    nome: aluno.nome,
                                    dia: dia,
                                    idFalta: infoDia?.idFalta,
                                  })
                                }
                                className="w-6 h-6 mx-auto bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded flex items-center justify-center font-bold text-xs cursor-help hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"
                                title={`Justificada: ${infoDia?.justificativa || "Sem observação"} - Clique para editar`}
                              >
                                J
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : props.carregandoFreqHoje ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <span className="text-4xl animate-bounce mb-3">⏳</span>
              <p className="text-slate-600 dark:text-slate-400 font-bold transition-colors">
                Carregando frequência de hoje...
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm transition-colors">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 transition-colors">
                    Aluno
                  </th>
                  <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-center transition-colors">
                    Status Hoje
                  </th>
                  <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-center transition-colors">
                    Faltas Acumuladas
                  </th>
                  <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-center transition-colors">
                    % Presença
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 transition-colors">
                {props.freqHojeFiltrada.map((aluno) => {
                  const taxaPresenca =
                    props.totalAulasTurma > 0
                      ? Math.round(
                          (aluno.presencasTotais / props.totalAulasTurma) * 100,
                        )
                      : 100;
                  return (
                    <tr
                      key={aluno.matricula}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100 transition-colors">
                          {aluno.nome}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono transition-colors">
                          {aluno.matricula}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {aluno.presenteHoje ? (
                          <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>{" "}
                            Presente ({aluno.horaHoje})
                          </span>
                        ) : (
                          <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></span>{" "}
                            Faltou
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-black text-lg transition-colors ${aluno.faltasTotais >= 3 ? "text-red-600 dark:text-red-500" : "text-slate-600 dark:text-slate-300"}`}
                        >
                          {aluno.faltasTotais}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1 transition-colors">
                          / {props.totalAulasTurma}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 max-w-25 mx-auto mt-1 transition-colors">
                          <div
                            className={`h-2.5 rounded-full transition-colors ${taxaPresenca >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                            style={{ width: `${taxaPresenca}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                          {taxaPresenca}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {props.freqHojeFiltrada.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-slate-500 dark:text-slate-400 transition-colors"
                    >
                      Nenhum aluno encontrado para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL SOBREPOSTO DE JUSTIFICATIVA */}
      {props.modalJustificativaAberto && (
        <div className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in transition-colors duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 border dark:border-slate-800 transition-colors duration-300">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 transition-colors">
              Justificar Falta
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 transition-colors">
              Aluno:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {props.modalJustificativaAberto.nome}
              </strong>{" "}
              <br /> Data da Falta:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {String(props.modalJustificativaAberto.dia).padStart(2, "0")}/
                {String(props.mesDiario).padStart(2, "0")}
              </strong>
            </p>
            <textarea
              rows={4}
              value={props.textoJustificativa}
              onChange={(e) => props.setTextoJustificativa(e.target.value)}
              placeholder="Digite o motivo (ex: Atestado médico entregue)"
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded p-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-amber-500 dark:focus:border-amber-500 mb-4 resize-none transition-colors"
            ></textarea>
            <div className="flex gap-2">
              <button
                onClick={() => props.setModalJustificativaAberto(null)}
                className="cursor-pointer flex-1 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={props.salvarJustificativa}
                className="cursor-pointer flex-1 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 rounded shadow-sm transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
