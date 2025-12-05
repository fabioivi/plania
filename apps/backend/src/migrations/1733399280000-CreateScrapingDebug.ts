import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateScrapingDebug1733399280000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'scraping_debug',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'external_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'scrape_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'html_snapshot',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'screenshot_path',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'extracted_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'extraction_warnings',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'extraction_errors',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'field_metrics',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'selector_attempts',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'viewport',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'scrape_duration_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'success',
            type: 'boolean',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create composite index on external_id and scrape_type for faster lookups
    await queryRunner.createIndex(
      'scraping_debug',
      new TableIndex({
        name: 'IDX_scraping_debug_external_id_type',
        columnNames: ['external_id', 'scrape_type'],
      }),
    );

    // Create index on success for filtering failed scrapings
    await queryRunner.createIndex(
      'scraping_debug',
      new TableIndex({
        name: 'IDX_scraping_debug_success',
        columnNames: ['success'],
      }),
    );

    // Create index on created_at for cleanup queries
    await queryRunner.createIndex(
      'scraping_debug',
      new TableIndex({
        name: 'IDX_scraping_debug_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('scraping_debug');
  }
}
