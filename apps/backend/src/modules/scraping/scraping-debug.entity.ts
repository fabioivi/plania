import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('scraping_debug')
@Index(['externalId', 'scrapeType'])
export class ScrapingDebug {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'external_id' })
  externalId: string; // ID do plano de ensino ou diário

  @Column({ name: 'scrape_type' })
  scrapeType: string; // 'teaching_plan', 'diary', 'proposta_trabalho'

  @Column({ name: 'url', nullable: true })
  url: string;

  @Column({ name: 'html_snapshot', type: 'text' })
  htmlSnapshot: string; // HTML completo da página

  @Column({ name: 'screenshot_path', nullable: true })
  screenshotPath: string; // Caminho para screenshot

  @Column({ name: 'extracted_data', type: 'jsonb', nullable: true })
  extractedData: any; // Dados extraídos (com sucesso ou parcial)

  @Column({ name: 'extraction_warnings', type: 'jsonb', default: [] })
  extractionWarnings: string[]; // Avisos durante extração

  @Column({ name: 'extraction_errors', type: 'jsonb', default: [] })
  extractionErrors: string[]; // Erros durante extração

  @Column({ name: 'field_metrics', type: 'jsonb', nullable: true })
  fieldMetrics: {
    total: number;
    extracted: number;
    missing: string[];
    completeness: number; // Percentual 0-100
  };

  @Column({ name: 'selector_attempts', type: 'jsonb', nullable: true })
  selectorAttempts: {
    field: string;
    attempted: string[];
    successful: string | null;
  }[];

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'viewport', type: 'jsonb', nullable: true })
  viewport: { width: number; height: number };

  @Column({ name: 'scrape_duration_ms', nullable: true })
  scrapeDurationMs: number;

  @Column({ name: 'success' })
  success: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
