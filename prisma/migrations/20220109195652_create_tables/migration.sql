-- CreateTable
CREATE TABLE "schools" (
    "client_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "client_org_uuid" UUID NOT NULL,
    "short_code" VARCHAR(255),
    "program_uuids" UUID[],
    "kl_uuid" UUID,
    "status" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("client_uuid")
);

-- CreateTable
CREATE TABLE "programs" (
    "kl_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "client_org_uuid" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("kl_uuid")
);

-- CreateTable
CREATE TABLE "roles" (
    "kl_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "client_org_uuid" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("kl_uuid")
);

-- CreateTable
CREATE TABLE "classes" (
    "client_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_code" VARCHAR(255),
    "client_org_uuid" UUID NOT NULL,
    "client_school_uuid" UUID NOT NULL,
    "program_uuids" UUID[],
    "kl_uuid" UUID,
    "status" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classes_pkey" PRIMARY KEY ("client_uuid")
);

-- CreateTable
CREATE TABLE "users" (
    "client_uuid" UUID NOT NULL,
    "given_name" VARCHAR(255) NOT NULL,
    "family_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "date_of_birth" VARCHAR(255),
    "gender" VARCHAR(255),
    "client_org_uuid" UUID NOT NULL,
    "client_school_uuid" UUID NOT NULL,
    "class_uuids" UUID[],
    "role_uuids" UUID[],
    "kl_uuid" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("client_uuid")
);

-- CreateTable
CREATE TABLE "organizations" (
    "client_uuid" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "kl_uuid" UUID NOT NULL,
    "kl_short_code" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("client_uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_kl_uuid_key" ON "schools"("kl_uuid");

-- CreateIndex
CREATE INDEX "schools_kl_uuid_idx" ON "schools"("kl_uuid");

-- CreateIndex
CREATE INDEX "programs_name_client_org_uuid_idx" ON "programs"("name", "client_org_uuid");

-- CreateIndex
CREATE INDEX "roles_name_client_org_uuid_idx" ON "roles"("name", "client_org_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "classes_kl_uuid_key" ON "classes"("kl_uuid");

-- CreateIndex
CREATE INDEX "classes_kl_uuid_idx" ON "classes"("kl_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_kl_uuid_key" ON "users"("kl_uuid");

-- CreateIndex
CREATE INDEX "users_kl_uuid_idx" ON "users"("kl_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_kl_uuid_key" ON "organizations"("kl_uuid");

-- CreateIndex
CREATE INDEX "organizations_kl_uuid_idx" ON "organizations"("kl_uuid");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_client_org_uuid_fkey" FOREIGN KEY ("client_org_uuid") REFERENCES "organizations"("client_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_client_org_uuid_fkey" FOREIGN KEY ("client_org_uuid") REFERENCES "organizations"("client_uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_client_org_uuid_fkey" FOREIGN KEY ("client_org_uuid") REFERENCES "organizations"("client_uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_client_org_uuid_fkey" FOREIGN KEY ("client_org_uuid") REFERENCES "organizations"("client_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_client_school_uuid_fkey" FOREIGN KEY ("client_school_uuid") REFERENCES "schools"("client_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_org_uuid_fkey" FOREIGN KEY ("client_org_uuid") REFERENCES "organizations"("client_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_school_uuid_fkey" FOREIGN KEY ("client_school_uuid") REFERENCES "schools"("client_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
