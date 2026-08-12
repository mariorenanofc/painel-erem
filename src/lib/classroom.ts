import { google, classroom_v1 } from 'googleapis';

function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/callback'
  );

  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("GOOGLE_REFRESH_TOKEN is missing in .env.local");
  }

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN.replace(/"/g, ''),
  });

  return oauth2Client;
}

let _classroom: classroom_v1.Classroom | null = null;
function getClassroom() {
  if (!_classroom) {
    _classroom = google.classroom({ version: 'v1', auth: getAuthClient() });
  }
  return _classroom;
}

export interface CourseWorkOptions {
  title: string;
  description: string;
  maxPoints?: number;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number; seconds: number };
  state?: 'PUBLISHED' | 'DRAFT';
}

export const ClassroomAPI = {
  /**
   * Retorna os cursos associados à conta
   */
  listarCursos: async () => {
    const res = await getClassroom().courses.list({
      courseStates: ['ACTIVE'],
    });
    return res.data.courses || [];
  },

  /**
   * Cria uma nova atividade (CourseWork) no Classroom
   */
  criarAtividade: async (courseId: string, options: CourseWorkOptions) => {
    const res = await getClassroom().courses.courseWork.create({
      courseId,
      requestBody: {
        title: options.title,
        description: options.description,
        maxPoints: options.maxPoints || 100,
        workType: 'ASSIGNMENT',
        state: options.state || 'PUBLISHED',
        dueDate: options.dueDate,
        dueTime: options.dueTime,
      },
    });
    return res.data;
  },

  /**
   * Atualiza uma atividade existente no Classroom
   */
  atualizarAtividade: async (courseId: string, courseWorkId: string, options: CourseWorkOptions) => {
    const res = await getClassroom().courses.courseWork.patch({
      courseId,
      id: courseWorkId,
      updateMask: 'title,description,maxPoints,state,dueDate,dueTime',
      requestBody: {
        title: options.title,
        description: options.description,
        maxPoints: options.maxPoints || 100,
        state: options.state,
        dueDate: options.dueDate,
        dueTime: options.dueTime,
      },
    });
    return res.data;
  },
};
