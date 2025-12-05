/**
 * Centralized selectors configuration for IFMS teaching plans
 * This makes the scraping system more resilient to HTML changes
 */

export interface SelectorConfig {
  primary: string;
  fallbacks: string[];
  validators?: string[]; // Expected text content for validation
}

export const TEACHING_PLAN_SELECTORS = {
  /**
   * Main table structure - all sections are in numbered tables
   */
  TABLES: {
    // Table 0: Diary Header (NOT a numbered section)
    DIARY_HEADER: {
      primary: 'table.table-striped.table-bordered.diario',
      fallbacks: [
        'table.table:first-of-type:has(td:contains("Classe:"))',
        'table.diario:has(td:contains("Professor(es)"))',
      ],
      validators: ['Classe:', 'Professor(es):'],
    },
    
    // Table 1 (Section 01): IDENTIFICAÇÃO
    IDENTIFICATION: {
      primary: 'table.table:has(th:contains("IDENTIFICAÇÃO"))',
      fallbacks: [
        'table.table:has(td:contains("CAMPUS:"))',
        'table.table-striped.table-condensed.table-bordered:nth-of-type(2)',
      ],
      validators: ['CAMPUS:', 'CURSO:', 'PROFESSOR(ES):'],
    },
    
    // Table 2 (Section 02): EMENTA
    EMENTA: {
      primary: 'table.table:has(th:contains("EMENTA"))',
      fallbacks: ['table.table:has(th:text-matches("02"))'],
      validators: ['EMENTA'],
    },
    
    // Table 3 (Section 03): OBJETIVO GERAL
    OBJETIVO_GERAL: {
      primary: 'table.table:has(th:contains("OBJETIVO GERAL"))',
      fallbacks: ['table.table:has(th:text-matches("03"))'],
      validators: ['OBJETIVO GERAL'],
    },
    
    // Table 4 (Section 04): OBJETIVOS ESPECÍFICOS
    OBJETIVOS_ESPECIFICOS: {
      primary: 'table.table:has(th:contains("OBJETIVOS ESPECÍFICOS"))',
      fallbacks: ['table.table:has(th:text-matches("04"))'],
      validators: ['OBJETIVOS ESPECÍFICOS'],
    },
    
    // Table 5 (Section 05): AVALIAÇÃO DA APRENDIZAGEM
    AVALIACAO: {
      primary: 'table.table:has(th:contains("AVALIAÇÃO DA APRENDIZAGEM"))',
      fallbacks: ['table.table:has(th:text-matches("05"))'],
      validators: ['AVALIAÇÃO'],
    },
    
    // Table 6 (Section 06): RECUPERAÇÃO
    RECUPERACAO: {
      primary: 'table.table:has(th:contains("RECUPERAÇÃO"))',
      fallbacks: ['table.table:has(th:text-matches("06"))'],
      validators: ['RECUPERAÇÃO'],
    },
    
    // Table 7 (Section 07): REFERÊNCIAS
    REFERENCIAS: {
      primary: 'table.table:has(th:contains("REFERÊNCIAS"))',
      fallbacks: ['table.table:has(th:text-matches("07"))'],
      validators: ['REFERÊNCIAS'],
    },
    
    // Table 8 (Section 08): PROPOSTA DE TRABALHO
    PROPOSTA_TRABALHO: {
      primary: 'table.table:has(th:contains("PROPOSTA DE TRABALHO"))',
      fallbacks: ['table.table:has(th:text-matches("08"))'],
      validators: ['PROPOSTA DE TRABALHO'],
    },
  },

  /**
   * Nested table selectors
   */
  NESTED_TABLES: {
    AVALIACAO_INNER: {
      primary: 'table.diario',
      fallbacks: [
        'table.table-striped:has(th:contains("Etapa"))',
        'table:has(th:contains("Instrumentos de avaliação"))',
      ],
    },
    
    PROPOSTA_TRABALHO_INNER: {
      primary: 'table#proposta_trabalho',
      fallbacks: [
        'table.data-table:has(th:contains("Metodologia"))',
        'table:has(th:contains("Período em dias"))',
      ],
    },
  },

  /**
   * Field selectors within sections
   */
  FIELDS: {
    // Diary Header fields
    CLASSE: {
      selectors: [
        'td:contains("Classe:"):first-of-type',
        'tr:first-of-type td:first-of-type',
      ],
    },
    
    UNIDADE_CURRICULAR_CODIGO: {
      selectors: [
        'td:contains("Unidade Curricular")',
        'tr:nth-of-type(1) td:nth-of-type(2)',
      ],
    },
    
    AULAS_NORMAIS_CRIADAS: {
      selectors: [
        'td:contains("Aulas Normais Criadas")',
        'tr:nth-of-type(2) td:nth-of-type(3)',
      ],
    },
    
    // Identification fields
    CAMPUS: {
      selectors: [
        'td:contains("CAMPUS:")',
        'tr:contains("CAMPUS") td:first-of-type',
      ],
      pattern: /CAMPUS:\s*(.+)/,
    },
    
    ANO_SEMESTRE: {
      selectors: [
        'td:contains("ANO/SEMESTRE:")',
        'tr:contains("CAMPUS") td:nth-of-type(2)',
      ],
      pattern: /ANO\/SEMESTRE:\s*(.+)/,
    },
    
    CURSO: {
      selectors: [
        'td:contains("CURSO:")',
        'tr:contains("CURSO") td:first-of-type',
      ],
      pattern: /CURSO:\s*(.+)/,
    },
    
    UNIDADE_CURRICULAR: {
      selectors: [
        'td:contains("UNIDADE CURRICULAR")',
        'tr:contains("UNIDADE CURRICULAR") td:nth-of-type(2)',
      ],
      pattern: /UNIDADE CURRICULAR.*:\s*(.+)/,
    },
    
    PROFESSORES: {
      selectors: [
        'td:contains("PROFESSOR(ES):")',
        'tr:contains("PROFESSOR") td',
      ],
      pattern: /PROFESSOR\(ES\):\s*(.+)/,
    },
    
    CARGA_HORARIA: {
      selectors: [
        'td:contains("Carga horária total")',
      ],
      pattern: /Carga horária total.*:\s*(\d+\.?\d*)/,
    },
    
    NUM_SEMANAS: {
      pattern: /Nº de semanas:\s*(\d+)/,
    },
    
    NUM_AULAS_TEORICA: {
      pattern: /Nº total de aulas teóricas:\s*(\d+)/,
    },
    
    NUM_AULAS_PRATICAS: {
      pattern: /Nº total de aulas práticas:\s*(\d+)/,
    },
    
    // Identification section - workload and classes data (Row 5)
    CARGA_HORARIA_CELL: {
      selectors: [
        'tr:has(td:contains("Carga horária total")) td:first-child',
        'td:contains("Carga horária total da UC")',
        'table.table tr:nth-child(5) td:first-child', // Row 5, Cell 1
      ],
    },

    AULAS_CELL: {
      selectors: [
        'tr:has(td:contains("Nº total de aulas teóricas")) td:last-child',
        'td:contains("Nº total de aulas teóricas")',
        'table.table tr:nth-child(5) td:last-child', // Row 5, Cell 2
      ],
    },
    
    // Status fields (Rows 6 and 7)
    STATUS_APROVACAO_CELL: {
      selectors: [
        'td:contains("STATUS DE APROVAÇÃO")',
        'td:contains("STATUS DE APROVAÇÂO")', // With typo variant
        'tr:has(td:contains("STATUS DE APROVA")) td',
        'table.table tr:nth-child(6) td', // Row 6
      ],
    },

    STATUS_COORD_CELL: {
      selectors: [
        'td:contains("STATUS DO/PARA COORD. PEDAG")',
        'tr:has(td:contains("COORD. PEDAG")) td',
        'table.table tr:nth-child(7) td', // Row 7
      ],
    },
  },

  /**
   * Histórico section
   */
  HISTORICO: {
    ACCORDION: {
      primary: '#accordion_historico',
      fallbacks: [
        'div.accordion:has(strong:contains("Histórico"))',
        'div:has(table:has(th:contains("Situação")))',
      ],
    },
    
    TABLE: {
      primary: '#accordion_historico table.diario',
      fallbacks: [
        'table:has(th:contains("Situação")):has(th:contains("Observações"))',
        'div.accordion table.table-striped',
      ],
    },
  },

  /**
   * Validation patterns
   */
  PATTERNS: {
    MES: /\d+\s*-\s*\w+/, // "8 - Agosto"
    PERIODO: /\d+\s+a\s+\d+/, // "12 a 16"
    NUM_AULAS: /^\d+$/, // "1", "4", "7"
    ANO_SEMESTRE: /\d{4}\/\d/, // "2025/2"
    DATE_BR: /\d{2}\/\d{2}\/\d{4}/, // "30/09/2025"
    DATETIME_BR: /\d{2}\/\d{2}\/\d{4}\s+às\s+\d{2}:\d{2}:\d{2}/, // "30/09/2025 às 14:19:12"
  },
};

/**
 * Helper to get table by section with fallback
 */
export function getTableBySection(
  document: Document,
  sectionConfig: SelectorConfig
): Element | null {
  // Try primary selector
  let table = document.querySelector(sectionConfig.primary);
  if (table && validateTableContent(table, sectionConfig.validators)) {
    return table;
  }
  
  // Try fallback selectors
  for (const fallback of sectionConfig.fallbacks) {
    table = document.querySelector(fallback);
    if (table && validateTableContent(table, sectionConfig.validators)) {
      return table;
    }
  }
  
  return null;
}

/**
 * Validate table content contains expected text
 */
function validateTableContent(
  table: Element,
  validators?: string[]
): boolean {
  if (!validators || validators.length === 0) return true;
  
  const text = table.textContent || '';
  return validators.some(validator => text.includes(validator));
}
