/*
  Warnings:

  - A unique constraint covering the columns `[userId,reportId]` on the table `Upvote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `upvote` ADD COLUMN `reportId` INTEGER NULL,
    MODIFY `suggestionId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Upvote_userId_reportId_key` ON `Upvote`(`userId`, `reportId`);

-- AddForeignKey
ALTER TABLE `Upvote` ADD CONSTRAINT `Upvote_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `reports`(`report_id`) ON DELETE CASCADE ON UPDATE CASCADE;
