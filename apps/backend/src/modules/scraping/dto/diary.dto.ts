export class DiaryDto {
    /**
     * Original ID from the source system (IFMS or SUAP)
     */
    id: string;

    /**
     * Source system identifier
     */
    systemId: 'IFMS' | 'SUAP';

    /**
     * Full name of the discipline/subject
     */
    disciplineName: string;

    /**
     * Course/Class code (e.g., "INFO 4A")
     */
    classCode: string;

    /**
     * Academic period/semester (e.g., "2024/1")
     */
    period: string;

    /**
     * Workload in hours (optional, as some lists don't provide it)
     */
    workload?: number;
}
