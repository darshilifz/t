import {MigrationInterface, QueryRunner} from "typeorm";

export class UserProfile1650945754989 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD COLUMN "User_Balence" DOUBLE(15) DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
       
    }

}
