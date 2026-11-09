export function getRankingKeys(date: Date = new Date()) {
  const dataAtual = new Date(date);
  
  // Mês
  const ano = dataAtual.getFullYear();
  const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
  const mesKey = `${ano}_${mes}`;

  // Semana (Segunda a Domingo)
  const diaSemana = dataAtual.getDay();
  const diffParaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioSemana = new Date(dataAtual);
  inicioSemana.setDate(dataAtual.getDate() - diffParaSegunda);
  inicioSemana.setHours(0, 0, 0, 0);
  
  // Obter o número da semana no ano (ISO 8601)
  const target = new Date(inicioSemana.valueOf());
  const dayNr = (inicioSemana.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const semanaKey = `${ano}_W${String(weekNumber).padStart(2, "0")}`;

  return { semanaKey, mesKey, inicioSemana };
}

/**
 * Retorna as chaves do ciclo imediatamente anterior (mês passado ou semana passada).
 */
export function getCicloAnteriorKeys(date: Date = new Date()) {
  const dataAtual = new Date(date);

  // Mês anterior (último dia do mês passado)
  const dataMesAnterior = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 0);
  const { mesKey: mesAnteriorKey } = getRankingKeys(dataMesAnterior);

  // Semana anterior (7 dias antes do início da semana atual)
  const { inicioSemana } = getRankingKeys(dataAtual);
  const dataSemanaAnterior = new Date(inicioSemana.getTime() - 24 * 60 * 60 * 1000); // domingo da semana anterior
  const { semanaKey: semanaAnteriorKey } = getRankingKeys(dataSemanaAnterior);

  return {
    mesAnteriorKey,
    semanaAnteriorKey,
    dataMesAnterior,
    dataSemanaAnterior
  };
}

/**
 * Nomes amigáveis dos dias da semana para exibição em seletores
 */
export const DIAS_SEMANA_NOMES: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado"
};

/**
 * Retorna o rótulo amigável com as datas reais de uma semana (ex: "Semana 45 (02/11 a 06/11)")
 */
export function getLabelSemana(semanaKey: string): string {
  const match = semanaKey.match(/^(\d{4})_W(\d{1,2})$/);
  if (!match) return semanaKey;
  const ano = Number(match[1]);
  const semana = Number(match[2]);

  // Encontrar a segunda-feira da semana ISO
  const simples = new Date(ano, 0, 1 + (semana - 1) * 7);
  const dow = simples.getDay();
  const inicioSemana = new Date(simples);
  if (dow <= 4) {
    inicioSemana.setDate(simples.getDate() - simples.getDay() + 1);
  } else {
    inicioSemana.setDate(simples.getDate() + 8 - simples.getDay());
  }

  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 4); // Sexta-feira

  const fmt = (d: Date) => String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
  return `Semana ${semana} (${fmt(inicioSemana)} a ${fmt(fimSemana)})`;
}

/**
 * Retorna as opções inteligentes de fechamento de ciclo (com detecção do horário de corte).
 * Se for sexta após 16:59, sábado ou domingo, a semana corrente já é considerada o ciclo a fechar!
 */
export function getOpcoesCicloSemanal(date: Date = new Date(), diaCorte: number = 5, horaCorte: string = "16:59") {
  const dataAtual = new Date(date);
  const { semanaKey: semanaAtualKey, inicioSemana } = getRankingKeys(dataAtual);
  const { semanaAnteriorKey } = getCicloAnteriorKeys(dataAtual);

  const diaSemanaAtual = dataAtual.getDay();
  const horaMinutoAtual = String(dataAtual.getHours()).padStart(2, "0") + ":" + String(dataAtual.getMinutes()).padStart(2, "0");

  // Se já passou do dia/hora de fechamento nesta semana
  const passouCorteSemanaAtual =
    diaSemanaAtual > diaCorte || (diaSemanaAtual === diaCorte && horaMinutoAtual >= horaCorte);

  // A semana prioritária a ser apurada/fechada
  const semanaAlvoPrincipal = passouCorteSemanaAtual ? semanaAtualKey : semanaAnteriorKey;

  return {
    semanaAlvoPrincipal,
    semanaAtualKey,
    semanaAnteriorKey,
    passouCorteSemanaAtual,
    labelAlvoPrincipal: getLabelSemana(semanaAlvoPrincipal),
    labelSemanaAtual: getLabelSemana(semanaAtualKey),
    labelSemanaAnterior: getLabelSemana(semanaAnteriorKey)
  };
}
