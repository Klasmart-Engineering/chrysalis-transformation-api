-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kl_uuid" UUID NOT NULL,
    "kl_org_uuid" UUID NOT NULL,
    "client_uuid" UUID NOT NULL,
    "client_org_uuid" UUID,
    "client" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "programs_kl_uuid_key" ON "programs"("kl_uuid");

-- CreateIndex
CREATE INDEX "programs_client_uuid_idx" ON "programs"("client_uuid");

-- CreateIndex
CREATE INDEX "programs_client_org_uuid_idx" ON "programs"("client_org_uuid");
