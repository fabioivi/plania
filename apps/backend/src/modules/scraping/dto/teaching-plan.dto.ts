export class TeachingPlanIdentificationDto {
    campus: string;
    course: string;
    discipline: string;
    professors: string;
    period: string;
    workloadTotal: number;
    workloadTheoretical: number;
    workloadPractical: number;
}

export class TeachingPlanContentDto {
    description: string;
    methodology: string;
    resources: string;
    evaluation: string;
    objectives: string;
    bibliographyBasic: string;
    bibliographyComplementary: string;
}

export class TeachingPlanDto {
    /**
     * Plan ID in the source system
     */
    id: string;

    /**
     * Diary ID this plan belongs to
     */
    diaryId: string;

    /**
     * Source system
     */
    systemId: 'IFMS' | 'SUAP';

    /**
     * Current status of the plan (e.g., "Em preenchimento", "Aprovado")
     */
    status: string;

    /**
     * Identification details (Course, Campus, Load)
     */
    identification: TeachingPlanIdentificationDto;

    /**
     * Pedagogical content (Methodology, Evaluation, etc.)
     */
    content: TeachingPlanContentDto;
}
