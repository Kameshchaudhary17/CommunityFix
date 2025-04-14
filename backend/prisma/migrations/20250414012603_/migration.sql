/*
  Warnings:

  - You are about to alter the column `photo` on the `reports` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Json`.

*/
-- AlterTable
ALTER TABLE `reports` MODIFY `photo` JSON NULL;
