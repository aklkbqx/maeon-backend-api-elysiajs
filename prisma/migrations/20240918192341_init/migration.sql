-- CreateTable
CREATE TABLE `Users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstname` VARCHAR(150) NOT NULL,
    `lastname` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(60) NOT NULL,
    `tel` VARCHAR(20) NOT NULL,
    `profile` VARCHAR(150) NOT NULL DEFAULT 'default-profile.jpg',
    `role` ENUM('USER', 'ADMIN', 'HOSPITAL', 'MERCHANT', 'TOUR', 'LEARNING_RESOURCE', 'HOTEL', 'SEASONAL_TRAVEL') NOT NULL DEFAULT 'USER',
    `usage_status` ENUM('ONLINE', 'OFFILNE') NOT NULL DEFAULT 'OFFILNE',
    `account_status` ENUM('ACTIVE', 'SUSPEND', 'DELETE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `otp` VARCHAR(6) NULL,
    `otp_expiry` DATETIME(3) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Users_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
