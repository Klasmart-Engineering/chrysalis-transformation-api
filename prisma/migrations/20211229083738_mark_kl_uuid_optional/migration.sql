/*
  Warnings:

  - The `kl_uuid` column on the `schools` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[kl_uuid]` on the table `schools` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "schools" DROP COLUMN "kl_uuid",
ADD COLUMN     "kl_uuid" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "schools_kl_uuid_key" ON "schools"("kl_uuid");
