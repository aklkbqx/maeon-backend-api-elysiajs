/*
  Warnings:

  - You are about to drop the column `check-in` on the `accommodation` table. All the data in the column will be lost.
  - You are about to drop the column `check-out` on the `accommodation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `accommodation` DROP COLUMN `check-in`,
    DROP COLUMN `check-out`,
    ADD COLUMN `check_in` TEXT NULL,
    ADD COLUMN `check_out` TEXT NULL;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('SYSTEM', 'CHAT', 'ORDER', 'PAYMENT', 'PROMOTION', 'ANNOUNCEMENT', 'STATUS_UPDATE', 'REMINDER') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `data` LONGTEXT NULL,
    `user_id` INTEGER NOT NULL,
    `status` ENUM('UNREAD', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_status`(`status`),
    INDEX `idx_type`(`type`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
