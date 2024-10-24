/*
  Warnings:

  - You are about to drop the column `name` on the `accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `attractions` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `learning_resources` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `location_map` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `restaurant` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(3))`.
  - Added the required column `description` to the `accommodation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `learning_resources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `restaurant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `accommodation` DROP COLUMN `name`,
    ADD COLUMN `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `attractions` DROP COLUMN `name`,
    ADD COLUMN `description` TEXT NULL;

-- AlterTable
ALTER TABLE `learning_resources` DROP COLUMN `name`,
    ADD COLUMN `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `locations` DROP COLUMN `description`,
    DROP COLUMN `location_map`,
    ADD COLUMN `note` TEXT NULL,
    MODIFY `time_slots` LONGTEXT NULL,
    MODIFY `owner_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `restaurant` DROP COLUMN `name`,
    ADD COLUMN `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('user', 'admin', 'hospital', 'restaurant', 'attractions', 'learning_resources', 'accommodation') NULL DEFAULT 'user';
