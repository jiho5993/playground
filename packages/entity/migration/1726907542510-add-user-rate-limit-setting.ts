import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRateLimitSetting1726907542510 implements MigrationInterface {
    name = 'AddUserRateLimitSetting1726907542510'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user_rate_limit_setting\` (\`id\` bigint NOT NULL AUTO_INCREMENT, \`userId\` bigint NOT NULL, \`type\` varchar(50) NOT NULL, \`status\` varchar(50) NOT NULL DEFAULT 'DEACTIVATED', \`limit\` int NOT NULL, \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`modifiedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_c4bd0330a997e1cbb833a34cd7\` (\`userId\`, \`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`user_rate_limit_setting\` ADD CONSTRAINT \`FK_f77c2987d852d6b26ae59540ba1\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_rate_limit_setting\` DROP FOREIGN KEY \`FK_f77c2987d852d6b26ae59540ba1\``);
        await queryRunner.query(`DROP INDEX \`IDX_c4bd0330a997e1cbb833a34cd7\` ON \`user_rate_limit_setting\``);
        await queryRunner.query(`DROP TABLE \`user_rate_limit_setting\``);
    }

}
