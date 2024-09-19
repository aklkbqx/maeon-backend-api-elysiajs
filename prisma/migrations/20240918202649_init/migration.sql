/*
  Warnings:

  - You are about to drop the column `is_verified` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `otp` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `otp_expiry` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Users` DROP COLUMN `is_verified`,
    DROP COLUMN `otp`,
    DROP COLUMN `otp_expiry`;
