import { GradeLevel, GeneratedPlan } from '../types';

export const generateLessonPlan = async (data: { topic: string; grade: GradeLevel }): Promise<GeneratedPlan> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        title: `Aula sobre ${data.topic}`,
        duration: '2 aulas de 50min',
        bnccCodes: ['EF03CI07', 'EF15LP03', 'EF03GE02'],
        objectives: [
            `Identificar os principais elementos relacionados a ${data.topic}`,
            'Relacionar o conteúdo com o cotidiano dos alunos',
            'Desenvolver habilidades de observação e registro'
        ],
        methodology: 'A aula iniciará com uma roda de conversa para levantamento de conhecimentos prévios. Em seguida, será apresentado um vídeo curto sobre o tema, culminando em uma atividade prática de colagem e desenho.'
    };
};
