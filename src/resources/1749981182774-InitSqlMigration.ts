import { MigrationInterface, QueryRunner } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class Init1749981182774 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const filePath = path.join(__dirname, 'init-schema.sql');
    const sql = fs.readFileSync(filePath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optional: Nếu muốn rollback thì DROP các table thủ công
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS accounts`);
  }
}
