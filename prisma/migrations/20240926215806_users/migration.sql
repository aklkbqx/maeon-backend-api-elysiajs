-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('DELETE', 'ACTIVE', 'SUSPEND');

-- CreateEnum
CREATE TYPE "usage_status" AS ENUM ('OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN', 'HOSPITAL', 'MERCHANT', 'TOUR', 'LEARNING_RESOURCE', 'HOTEL', 'SEASONAL_TRAVEL');

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
    "statuslastupdate" TIMESTAMP(6),
    "account_status" "account_status" NOT NULL DEFAULT 'ACTIVE',
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
