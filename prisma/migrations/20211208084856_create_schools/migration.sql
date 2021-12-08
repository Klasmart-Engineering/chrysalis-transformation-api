-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kl_uuid" UUID NOT NULL,
    "client_uuid" UUID NOT NULL,
    "kl_org_uuid" UUID NOT NULL,
    "program_uuid" UUID NOT NULL,
    "program_name" VARCHAR(255) NOT NULL,
    "client_org_uuid" UUID NOT NULL,
    "organization_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_kl_uuid_key" ON "schools"("kl_uuid");

-- CreateIndex
CREATE INDEX "schools_client_uuid_idx" ON "schools"("client_uuid");

-- CreateIndex
CREATE INDEX "schools_client_org_uuid_idx" ON "schools"("client_org_uuid");
