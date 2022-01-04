/*
  Warnings:

  - You are about to drop the column `program_name` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `program_uuid` on the `schools` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "schools_client_org_uuid_idx";

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "program_name",
DROP COLUMN "program_uuid",
ADD COLUMN     "program_names" TEXT[],
ADD COLUMN     "short_code" VARCHAR(255),
ADD COLUMN     "status" VARCHAR(255),
ALTER COLUMN "kl_uuid" SET DATA TYPE TEXT,
ALTER COLUMN "client_org_uuid" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "schools_kl_org_uuid_idx" ON "schools"("kl_org_uuid");
