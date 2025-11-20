-- AlterTable
ALTER TABLE `User` ADD COLUMN `twoFactorCode` VARCHAR(191) NULL,
    ADD COLUMN `twoFactorExpires` DATETIME(3) NULL;
