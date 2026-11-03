export interface FeriadoNacional {
  data: string; // "MM-DD"
  nome: string;
  tipo: "nacional" | "escolar";
}

/**
 * Feriados Nacionais Oficiais do Brasil
 */
export const FERIADOS_NACIONAIS_FIXOS: FeriadoNacional[] = [
  { data: "01-01", nome: "Ano Novo (Confraternização Universal)", tipo: "nacional" },
  { data: "04-21", nome: "Tiradentes", tipo: "nacional" },
  { data: "05-01", nome: "Dia do Trabalhador", tipo: "nacional" },
  { data: "09-07", nome: "Independência do Brasil", tipo: "nacional" },
  { data: "10-12", nome: "Nossa Senhora Aparecida", tipo: "nacional" },
  { data: "11-02", nome: "Finados", tipo: "nacional" },
  { data: "11-15", nome: "Proclamação da República", tipo: "nacional" },
  { data: "11-20", nome: "Dia da Consciência Negra", tipo: "nacional" },
  { data: "12-25", nome: "Natal", tipo: "nacional" },
];

/**
 * Retorna os feriados móveis aproximados para o ano letivo
 */
export function getFeriadosAno(ano: number): Array<{ dataIso: string; nome: string; tipo: "nacional" | "escolar" }> {
  const lista: Array<{ dataIso: string; nome: string; tipo: "nacional" | "escolar" }> = [];

  // 1. Feriados fixos
  FERIADOS_NACIONAIS_FIXOS.forEach((f) => {
    lista.push({
      dataIso: `${ano}-${f.data}`,
      nome: f.nome,
      tipo: f.tipo
    });
  });

  // 2. Feriados móveis comuns (Carnaval, Páscoa, Corpus Christi)
  // Cálculo simplificado de Páscoa (Algoritmo de Meeus/Jones/Butcher)
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mesPascoa = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Março, 4 = Abril
  const diaPascoa = ((h + l - 7 * m + 114) % 31) + 1;

  const dataPascoa = new Date(ano, mesPascoa - 1, diaPascoa);
  const formatIso = (dt: Date) => {
    const y = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  lista.push({ dataIso: formatIso(dataPascoa), nome: "Páscoa", tipo: "nacional" });

  // Sexta-feira Santa: 2 dias antes da Páscoa
  const sextaSanta = new Date(dataPascoa.getTime() - 2 * 24 * 60 * 60 * 1000);
  lista.push({ dataIso: formatIso(sextaSanta), nome: "Sexta-feira Santa (Paixão de Cristo)", tipo: "nacional" });

  // Terça-feira de Carnaval: 47 dias antes da Páscoa
  const carnaval = new Date(dataPascoa.getTime() - 47 * 24 * 60 * 60 * 1000);
  lista.push({ dataIso: formatIso(carnaval), nome: "Carnaval", tipo: "nacional" });

  // Corpus Christi: 60 dias após a Páscoa
  const corpusChristi = new Date(dataPascoa.getTime() + 60 * 24 * 60 * 60 * 1000);
  lista.push({ dataIso: formatIso(corpusChristi), nome: "Corpus Christi", tipo: "nacional" });

  return lista;
}
