-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('DELETE', 'ACTIVE', 'SUSPEND');

-- CreateEnum
CREATE TYPE "usage_status" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN', 'HOSPITAL', 'MERCHANT', 'TOUR', 'LEARNING_RESOURCE', 'HOTEL', 'SEASONAL_TRAVEL');

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "cost" DECIMAL(10,2),
    "location_id" INTEGER NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" INTEGER NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "subdistrict_id" INTEGER,
    "website" VARCHAR(255),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "owner_id" INTEGER NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locationtype" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "locationtype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "type" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "start" JSONB NOT NULL,
    "end" JSONB NOT NULL,
    "duration" INTEGER NOT NULL,
    "total_price" DECIMAL(8,2) NOT NULL,
    "wellness_dimensions" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdat" TIMESTAMP(6) NOT NULL,
    "updatedat" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programtypes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "programtypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdistricts" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subdistricts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "firstname" VARCHAR(150) NOT NULL,
    "lastname" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password" VARCHAR(60) NOT NULL,
    "tel" VARCHAR(20) NOT NULL,
    "profilepicture" VARCHAR(150) NOT NULL DEFAULT 'default-profile.jpg',
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "usage_status" "usage_status" NOT NULL DEFAULT 'OFFLINE',
    "statuslastupdate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "account_status" "account_status" NOT NULL DEFAULT 'ACTIVE',
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_activity_location" ON "activities"("location_id");

-- CreateIndex
CREATE INDEX "idx_location_name" ON "locations"("name");

-- CreateIndex
CREATE INDEX "idx_location_owner" ON "locations"("owner_id");

-- CreateIndex
CREATE INDEX "idx_location_subdistrict" ON "locations"("subdistrict_id");

-- CreateIndex
CREATE INDEX "idx_location_type" ON "locations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "locationtype_name_key" ON "locationtype"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subdistricts_name_key" ON "subdistricts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_role" ON "users"("role");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_locationid_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_subdistrict_id_fkey" FOREIGN KEY ("subdistrict_id") REFERENCES "subdistricts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_type_fkey" FOREIGN KEY ("type") REFERENCES "locationtype"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_type_fkey" FOREIGN KEY ("type") REFERENCES "programtypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
