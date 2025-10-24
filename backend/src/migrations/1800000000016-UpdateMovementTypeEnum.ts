import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMovementTypeEnum1800000000016 implements MigrationInterface {
  name = 'UpdateMovementTypeEnum1800000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update the movement_type_enum to include all the values from the entity
    await queryRunner.query(`
      ALTER TYPE public.movement_type_enum
      ADD VALUE 'INITIAL' BEFORE 'IN';
    `);

    await queryRunner.query(`
      ALTER TYPE public.movement_type_enum
      ADD VALUE 'RETURN_CUSTOMER' AFTER 'SALE';
    `);

    await queryRunner.query(`
      ALTER TYPE public.movement_type_enum
      ADD VALUE 'RETURN_SUPPLIER' AFTER 'RETURN_CUSTOMER';
    `);

    await queryRunner.query(`
      ALTER TYPE public.movement_type_enum
      ADD VALUE 'ADJUSTMENT' AFTER 'RETURN_SUPPLIER';
    `);

    await queryRunner.query(`
      ALTER TYPE public.movement_type_enum
      ADD VALUE 'DAMAGE' AFTER 'TRANSFER_OUT';
    `);

    await queryRunner.query(`
      ALTER TYPE public.movement_type_enum
      ADD VALUE 'EXPIRY' AFTER 'DAMAGE';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing values from enums
    // So we won't implement a down migration for this
  }
}
