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
