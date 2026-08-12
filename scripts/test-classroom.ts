require('dotenv').config({ path: '.env.local' });
import { ClassroomAPI } from '../src/lib/classroom';

async function run() {
  try {
    const cursos = await ClassroomAPI.listarCursos();
    console.log("Cursos Encontrados no Classroom:");
    cursos.forEach(c => {
      console.log(`- ID: ${c.id} | NOME: ${c.name} | ESTADO: ${c.courseState}`);
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error(err.message);
  }
}
run();
