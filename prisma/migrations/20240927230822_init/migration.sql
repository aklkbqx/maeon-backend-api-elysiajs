/*
  Warnings:

  - You are about to drop the column `image_name` on the `program_images` table. All the data in the column will be lost.
  - Added the required column `image_name_data` to the `program_images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `program_images` DROP COLUMN `image_name`,
    ADD COLUMN `image_name_data` LONGTEXT NOT NULL;
