/*
  Warnings:

  - You are about to alter the column `status` on the `suggestion` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `suggestion` MODIFY `status` ENUM('Pending', 'IN_PROGRESS', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'Pending';
