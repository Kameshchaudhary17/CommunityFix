/*
  Warnings:

  - You are about to drop the column `upvotes` on the `suggestion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `suggestion` DROP COLUMN `upvotes`;

-- CreateTable
CREATE TABLE `Upvote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `suggestionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Upvote_userId_suggestionId_key`(`userId`, `suggestionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Upvote` ADD CONSTRAINT `Upvote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Upvote` ADD CONSTRAINT `Upvote_suggestionId_fkey` FOREIGN KEY (`suggestionId`) REFERENCES `Suggestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
