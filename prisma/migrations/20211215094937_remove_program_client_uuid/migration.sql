/*
  Warnings:

  - You are about to drop the column `client_uuid` on the `programs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "programs_client_uuid_idx";

-- AlterTable
ALTER TABLE "programs" DROP COLUMN "client_uuid";
