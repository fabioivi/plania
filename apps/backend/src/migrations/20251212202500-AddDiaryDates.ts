import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDiaryDates20251212202500 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add data_abertura column
        await queryRunner.addColumn(
            'diaries',
            new TableColumn({
                name: 'data_abertura',
                type: 'timestamp',
                isNullable: true,
                comment: 'Data de abertura do diário',
            }),
        );

        // Add data_fechamento column
        await queryRunner.addColumn(
            'diaries',
            new TableColumn({
                name: 'data_fechamento',
                type: 'timestamp',
                isNullable: true,
                comment: 'Data de fechamento do diário',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('diaries', 'data_fechamento');
        await queryRunner.dropColumn('diaries', 'data_abertura');
    }
}
