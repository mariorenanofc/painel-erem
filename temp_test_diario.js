async function test() {
  try {
    const resDiario = await fetch("http://localhost:3000/api/tutor/diario-classe?turma=Turma%201%20-%201%C2%BA%20Ano&mes=8&ano=2026");
    const jsonDiario = await resDiario.json();
    console.log("Diario Classe Response (Agosto 2026):");
    console.log(JSON.stringify(jsonDiario, null, 2));

    console.log("\n-----------------------------------------------\n");

    const resHoje = await fetch("http://localhost:3000/api/tutor/frequencia-hoje?turma=Turma%201%20-%201%C2%BA%20Ano");
    const jsonHoje = await resHoje.json();
    console.log("Frequencia Hoje Response:");
    console.log(JSON.stringify(jsonHoje, null, 2));
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
