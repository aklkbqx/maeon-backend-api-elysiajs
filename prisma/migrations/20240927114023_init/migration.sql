/*
  Warnings:

  - You are about to drop the column `latitude` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `total_price` on the `programs` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `statusLastUpdate` on the `users` table. All the data in the column will be lost.
  - Added the required column `location_map` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time_slots` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schedules` to the `programs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `locations` DROP COLUMN `latitude`,
    DROP COLUMN `longitude`,
    ADD COLUMN `location_map` LONGTEXT NOT NULL,
    ADD COLUMN `time_slots` LONGTEXT NOT NULL;

-- AlterTable
ALTER TABLE `programs` DROP COLUMN `duration`,
    DROP COLUMN `end`,
    DROP COLUMN `start`,
    DROP COLUMN `total_price`,
    ADD COLUMN `schedules` LONGTEXT NOT NULL,
    MODIFY `wellness_dimensions` TEXT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `profilePicture`,
    DROP COLUMN `statusLastUpdate`,
    ADD COLUMN `profile_picture` VARCHAR(150) NULL DEFAULT 'default-profile.jpg',
    ADD COLUMN `status_last_update` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0);
