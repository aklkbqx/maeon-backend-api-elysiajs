/*
  Warnings:

  - You are about to drop the column `end_date` on the `program_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `program_id` on the `program_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `program_bookings` table. All the data in the column will be lost.
  - Added the required column `booking_data` to the `program_bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `program_bookings` DROP FOREIGN KEY `program_bookings_ibfk_2`;

-- AlterTable
ALTER TABLE `program_bookings` DROP COLUMN `end_date`,
    DROP COLUMN `program_id`,
    DROP COLUMN `start_date`,
    ADD COLUMN `booking_data` LONGTEXT NOT NULL;
