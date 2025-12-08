import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateLLMConfigs1733699999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'llm_configs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['gemini', 'openai', 'claude', 'grok'],
            isNullable: false,
          },
          {
            name: 'encrypted_api_key',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'iv',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'auth_tag',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'model_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'additional_config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'llm_configs',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index for user_id + provider
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_llm_configs_user_provider" 
      ON "llm_configs" ("user_id", "provider")
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_llm_configs_user_active" 
      ON "llm_configs" ("user_id", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_llm_configs_user_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_llm_configs_user_provider"`);

    // Drop foreign key
    const table = await queryRunner.getTable('llm_configs');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('llm_configs', foreignKey);
      }
    }

    // Drop table
    await queryRunner.dropTable('llm_configs');
  }
}
