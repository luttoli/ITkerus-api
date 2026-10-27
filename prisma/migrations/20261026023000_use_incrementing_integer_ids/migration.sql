-- 개발 초기 UUID 데이터를 제거하고 마이밀링과 같은 자동 증가 숫자 ID 구조로 다시 생성한다.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `ITkerusNote`;
DROP TABLE IF EXISTS `ProjectImage`;
DROP TABLE IF EXISTS `ProjectLink`;
DROP TABLE IF EXISTS `ProjectRequestedRole`;
DROP TABLE IF EXISTS `ProjectPostPurpose`;
DROP TABLE IF EXISTS `ProjectPost`;
DROP TABLE IF EXISTS `UserSecondaryRole`;
DROP TABLE IF EXISTS `SocialAccount`;
DROP TABLE IF EXISTS `User`;
SET FOREIGN_KEY_CHECKS = 1;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nickname` VARCHAR(10) NULL,
    `introduction` VARCHAR(60) NULL,
    `primaryRole` ENUM('DEVELOPER', 'PLANNER', 'DESIGNER', 'MARKETER', 'OPERATOR', 'USER_TESTER') NULL,
    `isOnboardingCompleted` BOOLEAN NOT NULL DEFAULT false,
    `termsAcceptedAt` DATETIME(3) NULL,
    `privacyAcceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_nickname_key`(`nickname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` ENUM('APPLE', 'KAKAO') NOT NULL,
    `providerUserId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SocialAccount_userId_idx`(`userId`),
    UNIQUE INDEX `SocialAccount_provider_providerUserId_key`(`provider`, `providerUserId`),
    UNIQUE INDEX `SocialAccount_userId_provider_key`(`userId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSecondaryRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `role` ENUM('DEVELOPER', 'PLANNER', 'DESIGNER', 'MARKETER', 'OPERATOR', 'USER_TESTER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserSecondaryRole_userId_idx`(`userId`),
    UNIQUE INDEX `UserSecondaryRole_userId_role_key`(`userId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `authorId` INTEGER NOT NULL,
    `title` VARCHAR(50) NOT NULL,
    `summary` VARCHAR(120) NOT NULL,
    `story` TEXT NOT NULL,
    `status` ENUM('IN_DEVELOPMENT', 'RELEASED') NOT NULL,
    `itkerusFocus` VARCHAR(150) NULL,
    `iconUrl` VARCHAR(2048) NULL,
    `selectedImageUrl` VARCHAR(2048) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProjectPost_authorId_createdAt_idx`(`authorId`, `createdAt`),
    INDEX `ProjectPost_deletedAt_createdAt_id_idx`(`deletedAt`, `createdAt`, `id`),
    INDEX `ProjectPost_status_deletedAt_createdAt_idx`(`status`, `deletedAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectPostPurpose` (
    `projectId` INTEGER NOT NULL,
    `purpose` ENUM('INTRODUCTION', 'QUESTION') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectPostPurpose_purpose_projectId_idx`(`purpose`, `projectId`),
    PRIMARY KEY (`projectId`, `purpose`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectRequestedRole` (
    `projectId` INTEGER NOT NULL,
    `role` ENUM('DEVELOPER', 'PLANNER', 'DESIGNER', 'MARKETER', 'OPERATOR', 'USER_TESTER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectRequestedRole_role_projectId_idx`(`role`, `projectId`),
    PRIMARY KEY (`projectId`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `type` ENUM('APP_STORE', 'GOOGLE_PLAY', 'WEB') NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `position` SMALLINT UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectLink_projectId_position_idx`(`projectId`, `position`),
    UNIQUE INDEX `ProjectLink_projectId_type_key`(`projectId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `position` SMALLINT UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectImage_projectId_position_idx`(`projectId`, `position`),
    UNIQUE INDEX `ProjectImage_projectId_url_key`(`projectId`, `url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ITkerusNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `authorRole` ENUM('DEVELOPER', 'PLANNER', 'DESIGNER', 'MARKETER', 'OPERATOR', 'USER_TESTER') NOT NULL,
    `content` VARCHAR(600) NOT NULL,
    `didTryProject` BOOLEAN NOT NULL DEFAULT false,
    `isMarkedHelpful` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ITkerusNote_projectId_deletedAt_createdAt_idx`(`projectId`, `deletedAt`, `createdAt`),
    INDEX `ITkerusNote_authorId_deletedAt_createdAt_idx`(`authorId`, `deletedAt`, `createdAt`),
    UNIQUE INDEX `ITkerusNote_projectId_authorId_key`(`projectId`, `authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SocialAccount` ADD CONSTRAINT `SocialAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSecondaryRole` ADD CONSTRAINT `UserSecondaryRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPost` ADD CONSTRAINT `ProjectPost_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectPostPurpose` ADD CONSTRAINT `ProjectPostPurpose_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectRequestedRole` ADD CONSTRAINT `ProjectRequestedRole_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectLink` ADD CONSTRAINT `ProjectLink_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectImage` ADD CONSTRAINT `ProjectImage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ITkerusNote` ADD CONSTRAINT `ITkerusNote_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ITkerusNote` ADD CONSTRAINT `ITkerusNote_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

