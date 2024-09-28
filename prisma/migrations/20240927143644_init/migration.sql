/*
  Warnings:

  - Added the required column `total_price` to the `programs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `programs` ADD COLUMN `total_price` DECIMAL(8, 2) NOT NULL;
