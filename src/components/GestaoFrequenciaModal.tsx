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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* CABEÇALHO */}
        <div className="bg-emerald-700 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span>📍</span> Gestão de Frequência
            </h2>
            <div className="flex bg-emerald-800/50 rounded-lg p-1">
              <button
                onClick={() => props.setAbaDiario("mensal")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${props.abaDiario === "mensal" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-100 hover:text-white"}`}
              >
                Visão Mensal
              </button>
              <button
                onClick={() => props.setAbaDiario("hoje")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${props.abaDiario === "hoje" ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-100 hover:text-white"}`}
              >
                Frequência de Hoje
              </button>
            </div>
          </div>
          <button
            onClick={props.onClose}
            className="text-3xl leading-none hover:text-emerald-200"
          >
            &times;
          </button>
        </div>

        {/* FILTROS */}
        <div className="p-4 bg-slate-50 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-3">
            <select
              value={props.turmaDiario}
              onChange={(e) => props.setTurmaDiario(e.target.value)}
              className="border border-slate-300 rounded p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="Turma 1 - 1º Ano">Turma 1 - 1º Ano</option>
              <option value="Turma 2 - 2º Ano">Turma 2 - 2º Ano</option>
            </select>
            {props.abaDiario === "mensal" && (
              <>
                <select
                  value={props.mesDiario}
                  onChange={(e) => props.setMesDiario(e.target.value)}
                  className="border border-slate-300 rounded p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
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
                  className="border border-slate-300 rounded p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
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
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>{" "}
                Presente
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Falta
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>{" "}
                Justificada
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => props.setFiltroStatusHoje("Todos")}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-bold transition-all border ${props.filtroStatusHoje === "Todos" ? "bg-emerald-600 text-white border-emerald-700 shadow-inner" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  Todos ({props.dadosFreqHoje.length})
                </button>
                <button
                  onClick={() => props.setFiltroStatusHoje("Presentes")}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-bold transition-all border ${props.filtroStatusHoje === "Presentes" ? "bg-emerald-600 text-white border-emerald-700 shadow-inner" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  Presentes ({totalPresentes})
                </button>
                <button
                  onClick={() => props.setFiltroStatusHoje("Faltantes")}
                  className={`cursor-pointer px-3 py-1.5 rounded text-xs font-bold transition-all border ${props.filtroStatusHoje === "Faltantes" ? "bg-red-600 text-white border-red-700 shadow-inner" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  Faltantes ({totalFaltantes})
                </button>
              </div>
              <div className="flex gap-2 items-center ml-2 border pl-4 border-slate-200">
                <label className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  Ordenar:
                </label>
                <select
                  value={props.ordenacaoFreq}
                  onChange={(e) =>
                    props.setOrdenacaoFreq(
                      e.target.value as "alfabetica" | "mais_faltas",
                    )
                  }
                  className="border border-slate-300 rounded p-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="alfabetica">Ordem Alfabética</option>
                  <option value="mais_faltas">Mais Faltas</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* TABELAS */}
        <div className="p-0 flex-1 overflow-auto relative">
          {props.abaDiario === "mensal" ? (
            props.carregandoFreq ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <span className="text-4xl animate-bounce mb-3">📅</span>
                <p className="text-slate-600 font-bold">
                  Processando Diário de Classe...
                </p>
              </div>
            ) : props.diasComAula.length === 0 ? (
              <p className="text-center text-slate-500 py-12">
                Nenhuma aula registrada para esta turma neste mês.
              </p>
            ) : (
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 border-b border-r border-slate-200 sticky left-0 bg-slate-100 z-30 min-w-62">
                      Nome do Aluno
                    </th>
                    {props.diasComAula.map((dia) => (
                      <th
                        key={dia}
                        className="px-2 py-3 border-b border-slate-200 text-center min-w-15"
                        title={`Dia ${dia}`}
                      >
                        <div className="mx-auto text-slate-700 font-black">
                          Dia {dia}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {props.alunosDiario.map((aluno) => (
                    <tr
                      key={aluno.matricula}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-4 py-3 border-b border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10 font-bold text-slate-800">
                        <div className="truncate w-57">{aluno.nome}</div>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {aluno.matricula}
                        </span>
                      </td>
                      {props.diasComAula.map((dia) => {
                        const infoDia = aluno.frequencia[dia];
                        return (
                          <td
                            key={dia}
                            className="px-2 py-2 border-b border-slate-100 text-center border-r md:border-slate-50"
                          >
                            {infoDia?.status === "presente" && (
                              <div
                                className="w-6 h-6 mx-auto bg-emerald-100 text-emerald-600 rounded flex items-center justify-center font-bold text-xs"
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
                                className="w-6 h-6 mx-auto bg-red-100 text-red-600 rounded flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-red-200 hover:scale-110 transition-all shadow-sm"
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
                                className="w-6 h-6 mx-auto bg-amber-100 text-amber-600 rounded flex items-center justify-center font-bold text-xs cursor-help"
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
              <p className="text-slate-600 font-bold">
                Carregando frequência de hoje...
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-200">Aluno</th>
                  <th className="px-4 py-3 border-b border-slate-200 text-center">
                    Status Hoje
                  </th>
                  <th className="px-4 py-3 border-b border-slate-200 text-center">
                    Faltas Acumuladas
                  </th>
                  <th className="px-4 py-3 border-b border-slate-200 text-center">
                    % Presença
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {props.freqHojeFiltrada.map((aluno) => {
                  const taxaPresenca =
                    props.totalAulasTurma > 0
                      ? Math.round(
                          (aluno.presencasTotais / props.totalAulasTurma) * 100,
                        )
                      : 100;
                  return (
                    <tr key={aluno.matricula} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">
                          {aluno.nome}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {aluno.matricula}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {aluno.presenteHoje ? (
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                            Presente ({aluno.horaHoje})
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>{" "}
                            Faltou
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-black text-lg ${aluno.faltasTotais >= 3 ? "text-red-600" : "text-slate-600"}`}
                        >
                          {aluno.faltasTotais}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">
                          / {props.totalAulasTurma}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-25 mx-auto mt-1 ">
                          <div
                            className={`h-2.5 rounded-full ${taxaPresenca >= 75 ? "bg-emerald-500" : "bg-red-500"}`}
                            style={{ width: `${taxaPresenca}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 mt-1">
                          {taxaPresenca}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {props.freqHojeFiltrada.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-1">
              Justificar Falta
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Aluno: <strong>{props.modalJustificativaAberto.nome}</strong>{" "}
              <br /> Data da Falta:{" "}
              <strong>
                {String(props.modalJustificativaAberto.dia).padStart(2, "0")}/
                {String(props.mesDiario).padStart(2, "0")}
              </strong>
            </p>
            <textarea
              rows={4}
              value={props.textoJustificativa}
              onChange={(e) => props.setTextoJustificativa(e.target.value)}
              placeholder="Digite o motivo (ex: Atestado médico entregue)"
              className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 outline-none focus:border-amber-500 mb-4 resize-none"
            ></textarea>
            <div className="flex gap-2">
              <button
                onClick={() => props.setModalJustificativaAberto(null)}
                className="flex-1 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={props.salvarJustificativa}
                className="flex-1 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded shadow-sm"
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
