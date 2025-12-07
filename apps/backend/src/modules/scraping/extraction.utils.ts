import { parse, isValid, parseISO } from 'date-fns';

/**
 * Utilities for robust data extraction and parsing
 */

export class ExtractionUtils {
  /**
   * Clean and normalize text content
   */
  static cleanText(text: string | null | undefined): string | null {
    if (!text) return null;
    const cleaned = text
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/\n+/g, '\n') // Normalize line breaks
      .trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  /**
   * Parse decimal numbers (handles both . and , as decimal separator)
   */
  static parseDecimal(str: string | null | undefined): number | null {
    if (!str) return null;
    const normalized = str.replace(',', '.').replace(/[^\d.]/g, '');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse integer numbers (removes all non-digits)
   */
  static parseInteger(str: string | null | undefined): number | null {
    if (!str) return null;
    const parsed = parseInt(str.replace(/\D/g, ''));
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Parse Brazilian date format: "30/09/2025 às 14:19:12"
   * Uses date-fns for safe parsing
   */
  static parseBRDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    
    const match = dateStr.match(
      /(\d{2})\/(\d{2})\/(\d{4})\s+às\s+(\d{2}):(\d{2}):(\d{2})/
    );
    
    if (!match) return null;
    
    const [_, day, month, year, hour, minute, second] = match;
    
    // Use date-fns parse with explicit format
    const dateString = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    const parsedDate = parse(dateString, 'dd/MM/yyyy HH:mm:ss', new Date());
    
    return isValid(parsedDate) ? parsedDate : null;
  }

  /**
   * Parse Brazilian date format (simple): "13/08/2025" or "30/09/2025"
   * Uses date-fns for safe parsing without timezone issues
   */
  static parseBRDateSimple(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    
    // Remove any HTML tags and trim
    const cleaned = dateStr.replace(/<[^>]*>/g, '').trim();
    
    // Match DD/MM/YYYY format
    const match = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    
    if (!match) return null;
    
    const [_, day, month, year] = match;
    
    // Use date-fns parse with explicit format
    // This avoids timezone issues by parsing in local time
    const parsedDate = parse(`${day}/${month}/${year}`, 'dd/MM/yyyy', new Date());
    
    // Validate the parsed date
    if (!isValid(parsedDate)) {
      return null;
    }
    
    return parsedDate;
  }

  /**
   * Extract multiple values separated by delimiter
   */
  static extractMultipleValues(
    html: string,
    delimiter: '<br>' | ',' | ';' = '<br>'
  ): string[] {
    if (!html) return [];
    
    const parts = delimiter === '<br>' 
      ? html.split(/<br\s*\/?>/i)
      : html.split(delimiter);
    
    return parts
      .map(v => this.cleanText(v))
      .filter((v): v is string => v !== null && v.length > 0);
  }

  /**
   * Parse metodologia field with tecnicas and recursos
   */
  static parseMetodologia(innerHTML: string): {
    tecnicasEnsino: string[];
    recursosEnsino: string[];
    raw: string;
  } {
    const parts = innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/i);
    
    let tecnicas: string[] = [];
    let recursos: string[] = [];
    
    for (const part of parts) {
      const cleanPart = part.replace(/<[^>]+>/g, '').trim();
      
      if (cleanPart.includes('Técnicas de Ensino:')) {
        const text = cleanPart.replace('Técnicas de Ensino:', '').trim();
        tecnicas = text
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);
      }
      
      if (cleanPart.includes('Recursos de Ensino:')) {
        const text = cleanPart.replace('Recursos de Ensino:', '').trim();
        recursos = text
          .split(',')
          .map(r => r.trim())
          .filter(r => r.length > 0);
      }
    }
    
    // Get raw text as fallback
    const raw = innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return {
      tecnicasEnsino: tecnicas,
      recursosEnsino: recursos,
      raw,
    };
  }

  /**
   * Parse identification section to extract numeric and status fields
   */
  static parseIdentification(html: string): {
    cargaHorariaTotal: number | null;
    numeroSemanas: number | null;
    numeroAulasTeoricas: number | null;
    numeroAulasPraticas: number | null;
    statusAprovacao: string | null;
    statusCoordPedagogica: string | null;
  } {
    const result = {
      cargaHorariaTotal: null as number | null,
      numeroSemanas: null as number | null,
      numeroAulasTeoricas: null as number | null,
      numeroAulasPraticas: null as number | null,
      statusAprovacao: null as string | null,
      statusCoordPedagogica: null as string | null,
    };

    // Extract carga horária total
    const cargaMatch = html.match(
      /Carga\s+horária\s+total\s+da\s+UC[:\s]*<br\s*\/?>\s*([\d.,]+)/i
    );
    if (cargaMatch && cargaMatch[1]) {
      result.cargaHorariaTotal = this.parseDecimal(cargaMatch[1]);
    }

    // Extract número de semanas
    const semanasMatch = html.match(
      /Nº\s+de\s+semanas[:\s]*<br\s*\/?>\s*(\d+)/i
    );
    if (semanasMatch && semanasMatch[1]) {
      result.numeroSemanas = this.parseInteger(semanasMatch[1]);
    }

    // Extract número de aulas teóricas
    const teoricasMatch = html.match(
      /Nº\s+total\s+de\s+aulas\s+teóricas[:\s]*<br\s*\/?>\s*(\d+)/i
    );
    if (teoricasMatch && teoricasMatch[1]) {
      result.numeroAulasTeoricas = this.parseInteger(teoricasMatch[1]);
    }

    // Extract número de aulas práticas
    const praticasMatch = html.match(
      /Nº\s+total\s+de\s+aulas\s+práticas[:\s]*<br\s*\/?>\s*(\d+)/i
    );
    if (praticasMatch && praticasMatch[1]) {
      result.numeroAulasPraticas = this.parseInteger(praticasMatch[1]);
    }

    // Extract status de aprovação (flexible with typo APROVAÇÃO)
    const statusAprovacaoMatch = html.match(
      /STATUS\s+DE\s+APROVA[ÇC][ÂA]O\s+DO\s+PLANO[:\s]*<\/strong>\s*([^<]+)/i
    );
    if (statusAprovacaoMatch && statusAprovacaoMatch[1]) {
      result.statusAprovacao = this.cleanText(statusAprovacaoMatch[1]);
    }

    // Extract status coord. pedagógica
    const statusCoordMatch = html.match(
      /STATUS\s+DO\/PARA\s+COORD\.?\s+PEDAG\.?[:\s]*<\/strong>\s*([^<]+)/i
    );
    if (statusCoordMatch && statusCoordMatch[1]) {
      result.statusCoordPedagogica = this.cleanText(statusCoordMatch[1]);
    }

    return result;
  }

  /**
   * Extract a labeled value from HTML using flexible pattern matching
   * Example: extractLabeledValue(html, 'CAMPUS') extracts 'Campus Nova Andradina' from '<b>CAMPUS:</b> Campus Nova Andradina'
   */
  static extractLabeledValue(html: string, label: string): string | null {
    // Pattern: <b>LABEL:</b> value or <strong>LABEL:</strong> value
    const pattern = new RegExp(
      `<(?:b|strong)>${label}[:\\s]*<\\/(?:b|strong)>\\s*([^<]+)`,
      'i'
    );
    const match = html.match(pattern);
    return match && match[1] ? this.cleanText(match[1]) : null;
  }

  /**
   * Parse references section into structured basic and complementary bibliographies
   */
  static parseReferences(innerHTML: string): {
    bibliografiaBasica: string[];
    bibliografiaComplementar: string[];
    raw: string;
  } {
    const cleaned = this.cleanText(innerHTML);
    
    const result = {
      bibliografiaBasica: [],
      bibliografiaComplementar: [],
      raw: cleaned
    };

    // Split by common section headers
    const basicaMatch = cleaned.match(/Bibliografia\s+Básica\s*([\s\S]*?)(?=Bibliografia\s+Complementar|$)/i);
    const complementarMatch = cleaned.match(/Bibliografia\s+Complementar\s*([\s\S]*?)$/i);

    if (basicaMatch && basicaMatch[1]) {
      result.bibliografiaBasica = this.splitReferences(basicaMatch[1]);
    }

    if (complementarMatch && complementarMatch[1]) {
      result.bibliografiaComplementar = this.splitReferences(complementarMatch[1]);
    }

    return result;
  }

  /**
   * Split a block of references into individual items
   * Handles multi-line references that are part of the same entry
   */
  private static splitReferences(text: string): string[] {
    // Remove leading/trailing whitespace
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Split by line breaks and filter empty lines
    const lines = trimmed.split(/\n+/).map(line => line.trim()).filter(Boolean);
    
    // Group multi-line references (lines that don't start with uppercase author names)
    const references: string[] = [];
    let currentRef = '';

    for (const line of lines) {
      // Check if this looks like a new reference (starts with uppercase author or pattern)
      // References typically start with: LASTNAME, or LASTNAME; or just LASTNAME
      if (/^[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ][A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ\s]+[,;.]/.test(line)) {
        if (currentRef) {
          references.push(currentRef.trim());
        }
        currentRef = line;
      } else {
        // Continuation of previous reference
        currentRef += ' ' + line;
      }
    }

    // Don't forget the last reference
    if (currentRef) {
      references.push(currentRef.trim());
    }

    return references;
  }

  /**
   * Validate field format with regex
   */
  static validateFormat(
    value: string,
    pattern: RegExp,
    fieldName: string
  ): boolean {
    const isValid = pattern.test(value);
    if (!isValid) {
      console.warn(`⚠️ Invalid format for ${fieldName}: ${value}`);
    }
    return isValid;
  }

  /**
   * Extract text from element with multiple selector attempts
   */
  static extractWithFallback(
    container: Element,
    selectors: string[]
  ): string | null {
    for (const selector of selectors) {
      try {
        const element = container.querySelector(selector);
        if (element) {
          const text = this.cleanText(element.textContent);
          if (text) return text;
        }
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  /**
   * Safe querySelector with error handling
   */
  static safeQuerySelector(
    container: Document | Element,
    selector: string
  ): Element | null {
    try {
      return container.querySelector(selector);
    } catch (e) {
      console.error(`Invalid selector: ${selector}`, e);
      return null;
    }
  }

  /**
   * Safe querySelectorAll with error handling
   */
  static safeQuerySelectorAll(
    container: Document | Element,
    selector: string
  ): Element[] {
    try {
      return Array.from(container.querySelectorAll(selector));
    } catch (e) {
      console.error(`Invalid selector: ${selector}`, e);
      return [];
    }
  }
}

/**
 * Result wrapper for extraction operations
 */
export interface ExtractionResult<T> {
  success: boolean;
  data?: T;
  warnings: string[];
  errors: string[];
  completeness?: number;
}

/**
 * Create extraction result
 */
export function createExtractionResult<T>(
  data: T | null,
  warnings: string[] = [],
  errors: string[] = []
): ExtractionResult<T> {
  return {
    success: errors.length === 0 && data !== null,
    data: data || undefined,
    warnings,
    errors,
  };
}
