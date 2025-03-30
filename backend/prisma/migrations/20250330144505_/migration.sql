/*
  Warnings:

  - You are about to alter the column `citizenshipPhoto` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `Json`.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `citizenshipPhoto` JSON NULL;
