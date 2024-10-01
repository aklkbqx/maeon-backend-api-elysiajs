/*
  Warnings:

  - You are about to drop the column `time_slots` on the `locations` table. All the data in the column will be lost.
  - Added the required column `time_slot` to the `locations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `locations` DROP COLUMN `time_slots`,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `time_slot` LONGTEXT NOT NULL;
