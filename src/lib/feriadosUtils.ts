export interface FeriadoOuRecesso {
  dataIso: string; // "YYYY-MM-DD"
  nome: string;
  tipo: "nacional" | "estadual_pe" | "escolar_pe";
  descricao?: string;
  badge?: string;
}

/**
 * Feriados Nacionais Oficiais do Brasil (Fixos)
 */
export const FERIADOS_NACIONAIS_FIXOS = [
  { data: "01-01", nome: "Ano Novo (Confraternização Universal)", tipo: "nacional" as const },
  { data: "04-21", nome: "Tiradentes", tipo: "nacional" as const },
  { data: "05-01", nome: "Dia do Trabalhador", tipo: "nacional" as const },
  { data: "09-07", nome: "Independência do Brasil", tipo: "nacional" as const },
  { data: "10-12", nome: "Nossa Senhora Aparecida", tipo: "nacional" as const },
  { data: "11-02", nome: "Finados", tipo: "nacional" as const },
  { data: "11-15", nome: "Proclamação da República", tipo: "nacional" as const },
  { data: "11-20", nome: "Dia Nacional de Zumbi e da Consciência Negra", tipo: "nacional" as const },
  { data: "12-25", nome: "Natal", tipo: "nacional" as const },
];

/**
 * Feriados Estaduais de Pernambuco e Calendário Escolar Oficial SEE-PE (Fixos)
 * Base legal: Lei Estadual nº 16.059/2017 (Data Magna) e Instruções Normativas SEE-PE
 */
export const DATAS_ESTADUAIS_ESCOLARES_PE_FIXAS = [
  // Feriado Estadual Oficial de Pernambuco (Revolução de 1817)
  {
    data: "03-06",
    nome: "Data Magna do Estado de Pernambuco",
    tipo: "estadual_pe" as const,
    badge: "🦁 Feriado Estadual (PE)",
    descricao: "Feriado Estadual oficial em Pernambuco (Lei nº 16.059/2017 - Sem aula presencial)",
  },
  // Período Junino de São João
  {
    data: "06-23",
    nome: "Véspera de São João",
    tipo: "escolar_pe" as const,
    badge: "🌽 Recesso Junino (SEE-PE)",
    descricao: "Recesso Escolar da Rede Estadual de Ensino de Pernambuco",
  },
  {
    data: "06-24",
    nome: "São João (Feriado Tradicional PE)",
    tipo: "estadual_pe" as const,
    badge: "🌽 Feriado São João (PE)",
    descricao: "Feriado tradicional dos festejos juninos em Pernambuco (Sem aula presencial)",
  },
  // Datas Escolares e Pedagógicas
  {
    data: "08-11",
    nome: "Dia do Estudante",
    tipo: "escolar_pe" as const,
    badge: "🎓 Data Escolar (SEE-PE)",
    descricao: "Dia do Estudante na Rede Estadual de Ensino",
  },
  {
    data: "10-15",
    nome: "Dia do Professor / Educador",
    tipo: "escolar_pe" as const,
    badge: "👨‍🏫 Feriado Escolar (SEE-PE)",
    descricao: "Dia dos Professores (Feriado Escolar na Rede Estadual de Ensino - Sem aula presencial)",
  },
  {
    data: "10-28",
    nome: "Dia do Servidor Público",
    tipo: "escolar_pe" as const,
    badge: "🏛️ Ponto Facultativo (PE)",
    descricao: "Ponto facultativo estadual na Rede Estadual de Ensino",
  },
];

/**
 * Retorna todos os feriados e períodos de recesso oficial da SEE-PE para um ano específico
 */
export function getFeriadosAno(ano: number): FeriadoOuRecesso[] {
  const lista: FeriadoOuRecesso[] = [];

  const formatIso = (anoNum: number, mes: number, dia: number): string => {
    return `${anoNum}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  };

  // 1. Feriados Nacionais Fixos
  FERIADOS_NACIONAIS_FIXOS.forEach((f) => {
    lista.push({
      dataIso: `${ano}-${f.data}`,
      nome: f.nome,
      tipo: f.tipo,
      badge: "🏖️ Feriado Nacional",
      descricao: "Feriado Nacional (Sem aula presencial)",
    });
  });

  // 2. Feriados Estaduais de Pernambuco & Datas Escolares SEE-PE
  DATAS_ESTADUAIS_ESCOLARES_PE_FIXAS.forEach((f) => {
    lista.push({
      dataIso: `${ano}-${f.data}`,
      nome: f.nome,
      tipo: f.tipo,
      badge: f.badge,
      descricao: f.descricao,
    });
  });

  // 3. Recesso Escolar de Meio de Ano da Rede Estadual de Pernambuco (10 a 26 de Julho)
  // Período oficial de recesso da SEE-PE entre 1º e 2º semestre
  for (let dia = 10; dia <= 26; dia++) {
    const dataIso = formatIso(ano, 7, dia);
    lista.push({
      dataIso,
      nome: "Recesso Escolar de Julho (SEE-PE)",
      tipo: "escolar_pe",
      badge: "🏖️ Recesso Escolar (SEE-PE)",
      descricao: "Recesso de meio de ano da Rede Estadual de Ensino de Pernambuco (Sem aulas presenciais)",
    });
  }

  // 4. Recesso Escolar de Fim de Ano (23 a 31 de Dezembro)
  for (let dia = 23; dia <= 31; dia++) {
    const dataIso = formatIso(ano, 12, dia);
    // Ignorar 25 que já é Natal
    if (dia !== 25) {
      lista.push({
        dataIso,
        nome: "Recesso Escolar de Fim de Ano (SEE-PE)",
        tipo: "escolar_pe",
        badge: "🏖️ Férias Escolares (SEE-PE)",
        descricao: "Encerramento do ano letivo e recesso na Rede Estadual de Pernambuco",
      });
    }
  }

  // 5. Férias de Janeiro (02 a 31 de Janeiro)
  for (let dia = 2; dia <= 31; dia++) {
    const dataIso = formatIso(ano, 1, dia);
    lista.push({
      dataIso,
      nome: "Férias Escolares de Janeiro",
      tipo: "escolar_pe",
      badge: "🏖️ Férias Escolares (SEE-PE)",
      descricao: "Período de férias escolares antes do início do ano letivo",
    });
  }

  // 6. Feriados Móveis: Carnaval, Semana Santa e Corpus Christi
  // Algoritmo de Meeus/Jones/Butcher para cálculo de Páscoa
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
  const dateToIso = (dt: Date) => {
    const y = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  lista.push({
    dataIso: dateToIso(dataPascoa),
    nome: "Páscoa",
    tipo: "nacional",
    badge: "🏖️ Feriado Nacional",
    descricao: "Domingo de Páscoa",
  });

  // Quinta-feira Santa (Recesso escolar SEE-PE)
  const quintaSanta = new Date(dataPascoa.getTime() - 3 * 24 * 60 * 60 * 1000);
  lista.push({
    dataIso: dateToIso(quintaSanta),
    nome: "Quinta-feira Santa (Recesso Escolar)",
    tipo: "escolar_pe",
    badge: "🏖️ Recesso Escolar (SEE-PE)",
    descricao: "Recesso da Semana Santa na Rede Estadual de Ensino",
  });

  // Sexta-feira Santa: 2 dias antes da Páscoa (Feriado Nacional)
  const sextaSanta = new Date(dataPascoa.getTime() - 2 * 24 * 60 * 60 * 1000);
  lista.push({
    dataIso: dateToIso(sextaSanta),
    nome: "Sexta-feira Santa (Paixão de Cristo)",
    tipo: "nacional",
    badge: "🏖️ Feriado Nacional",
    descricao: "Paixão de Cristo (Sem aula presencial)",
  });

  // Carnaval na Rede Estadual de PE (Segunda, Terça de Carnaval e Quarta de Cinzas)
  const tercaCarnaval = new Date(dataPascoa.getTime() - 47 * 24 * 60 * 60 * 1000);
  const segCarnaval = new Date(tercaCarnaval.getTime() - 1 * 24 * 60 * 60 * 1000);
  const quartaCinzas = new Date(tercaCarnaval.getTime() + 1 * 24 * 60 * 60 * 1000);

  lista.push({
    dataIso: dateToIso(segCarnaval),
    nome: "Segunda-feira de Carnaval",
    tipo: "escolar_pe",
    badge: "🎭 Recesso Carnaval (SEE-PE)",
    descricao: "Recesso de Carnaval da Rede Estadual de Ensino de Pernambuco",
  });

  lista.push({
    dataIso: dateToIso(tercaCarnaval),
    nome: "Terça-feira de Carnaval",
    tipo: "estadual_pe",
    badge: "🎭 Feriado Carnaval",
    descricao: "Festejos de Carnaval (Sem aula presencial)",
  });

  lista.push({
    dataIso: dateToIso(quartaCinzas),
    nome: "Quarta-feira de Cinzas",
    tipo: "escolar_pe",
    badge: "🎭 Recesso Carnaval (SEE-PE)",
    descricao: "Recesso pós-Carnaval na Rede Estadual de Ensino",
  });

  // Corpus Christi: 60 dias após a Páscoa
  const corpusChristi = new Date(dataPascoa.getTime() + 60 * 24 * 60 * 60 * 1000);
  lista.push({
    dataIso: dateToIso(corpusChristi),
    nome: "Corpus Christi",
    tipo: "nacional",
    badge: "🏖️ Feriado / Ponto Facultativo",
    descricao: "Ponto facultativo escolar e religioso",
  });

  return lista;
}
