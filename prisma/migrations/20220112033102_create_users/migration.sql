-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "kl_uuid" UUID,
    "client_uuid" UUID NOT NULL,
    "errors" TEXT[],
    "status" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_kl_uuid_key" ON "users"("kl_uuid");

-- CreateIndex
CREATE INDEX "users_client_uuid_idx" ON "users"("client_uuid");
