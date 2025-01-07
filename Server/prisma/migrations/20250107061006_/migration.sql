-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_name` VARCHAR(95) NOT NULL,
    `user_email` VARCHAR(65) NOT NULL,
    `contact` VARCHAR(65) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `otp` VARCHAR(191) NULL,
    `otp_expiry` DATETIME(3) NULL,
    `isVerified` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `users_user_email_key`(`user_email`),
    UNIQUE INDEX `users_contact_key`(`contact`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
