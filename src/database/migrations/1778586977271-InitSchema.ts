import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1778586977271 implements MigrationInterface {
    name = 'InitSchema1778586977271'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Required for uuid_generate_v4() column defaults below. Safe to
        // run on a fresh Postgres or one where the extension already exists.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "funnel_tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "funnel_stage_id" uuid NOT NULL, "task_order" smallint NOT NULL, "title" character varying(200) NOT NULL, CONSTRAINT "PK_70d3898978bea5c6a33e98eb261" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "funnel_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "strategy_id" uuid NOT NULL, "stage_order" smallint NOT NULL, "title" character varying(100) NOT NULL, "description" text, CONSTRAINT "PK_4a0c461c532e1acb63ce6c44e32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_funnel_stages_strategy_order" ON "funnel_stages" ("strategy_id", "stage_order") `);
        await queryRunner.query(`CREATE TABLE "strategies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "title" character varying(200) NOT NULL, "product_name" character varying(100) NOT NULL, "target_audience" character varying(300) NOT NULL, "primary_goal" character varying(200) NOT NULL, "tone" character varying(20) NOT NULL, "additional_context" text, "generated_via" character varying(20) NOT NULL DEFAULT 'claude', "input_tokens" integer, "output_tokens" integer, CONSTRAINT "PK_9a0d363ddf5b40d080147363238" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "strategy_generation_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "strategy_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fd05544844812259f608342f4e5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_strategy_generation_logs_user_day" ON "strategy_generation_logs" ("user_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "funnel_tasks" ADD CONSTRAINT "FK_c23717cb7c7982dc0928d23d2a7" FOREIGN KEY ("funnel_stage_id") REFERENCES "funnel_stages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "funnel_stages" ADD CONSTRAINT "FK_bce66c188e57132bc155e6b3d7a" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "funnel_stages" DROP CONSTRAINT "FK_bce66c188e57132bc155e6b3d7a"`);
        await queryRunner.query(`ALTER TABLE "funnel_tasks" DROP CONSTRAINT "FK_c23717cb7c7982dc0928d23d2a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_strategy_generation_logs_user_day"`);
        await queryRunner.query(`DROP TABLE "strategy_generation_logs"`);
        await queryRunner.query(`DROP TABLE "strategies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_funnel_stages_strategy_order"`);
        await queryRunner.query(`DROP TABLE "funnel_stages"`);
        await queryRunner.query(`DROP TABLE "funnel_tasks"`);
    }

}
