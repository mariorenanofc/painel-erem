fetch('http://localhost:3000/api/alunos/ranking?filtroTempo=geral&nocache=true')
  .then(res => res.json())
  .then(data => {
    const turmas = new Set();
    data.ranking.forEach(aluno => turmas.add(aluno.turma));
    console.log('Turmas encontradas no Ranking:');
    console.log(Array.from(turmas));
  })
  .catch(console.error);
