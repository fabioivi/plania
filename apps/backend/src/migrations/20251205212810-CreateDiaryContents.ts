import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDiaryContents20251205212810 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'diary_contents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'diary_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'content_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'obs_id',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'time_range',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '1',
            isNullable: false,
            comment: 'N: Normal, A: Antecipação, R: Reposição',
          },
          {
            name: 'is_non_presential',
            type: 'boolean',
            default: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'observations',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_antecipation',
            type: 'boolean',
            default: false,
          },
          {
            name: 'original_content_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'original_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Add foreign key to diaries table
    await queryRunner.createForeignKey(
      'diary_contents',
      new TableForeignKey({
        columnNames: ['diary_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'diaries',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on diary_id for faster queries
    await queryRunner.query(
      `CREATE INDEX "IDX_diary_contents_diary_id" ON "diary_contents" ("diary_id")`,
    );

    // Create index on content_id for faster lookups
    await queryRunner.query(
      `CREATE INDEX "IDX_diary_contents_content_id" ON "diary_contents" ("content_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('diary_contents');
  }
}
