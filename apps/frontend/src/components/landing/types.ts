export enum GradeLevel {
    KINDERGARTEN = 'Educação Infantil',
    ELEMENTARY_1 = 'Ensino Fundamental I',
    ELEMENTARY_2 = 'Ensino Fundamental II',
    HIGH_SCHOOL = 'Ensino Médio'
}

export interface GeneratedPlan {
    title: string;
    duration: string;
    bnccCodes: string[];
    objectives: string[];
    methodology: string;
}
