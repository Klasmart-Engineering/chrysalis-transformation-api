-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kl_uuid" UUID NOT NULL,
    "kl_org_uuid" UUID NOT NULL,
    "client_uuid" UUID NOT NULL,
    "short_code" VARCHAR(255),
    "organization_name" VARCHAR(255) NOT NULL,
    "school_name" VARCHAR(255) NOT NULL,
    "program_names" TEXT[],
    "client" VARCHAR(255),
    "errors" TEXT[],
    "status" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classes_kl_uuid_key" ON "classes"("kl_uuid");

-- CreateIndex
CREATE INDEX "classes_kl_org_uuid_idx" ON "classes"("kl_org_uuid");

-- CreateIndex
CREATE INDEX "classes_client_uuid_idx" ON "classes"("client_uuid");
