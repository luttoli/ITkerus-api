-- AlterTable
ALTER TABLE `User` ADD COLUMN `privacyAcceptedAt` DATETIME(3) NULL,
    ADD COLUMN `termsAcceptedAt` DATETIME(3) NULL;
