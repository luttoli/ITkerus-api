-- CreateTable
CREATE TABLE `ProjectPost` (
    `id` CHAR(36) NOT NULL,
    `authorId` CHAR(36) NOT NULL,
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
    INDEX `ProjectPost_status_deletedAt_createdAt_idx`(`status`, `deletedAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectPostPurpose` (
    `projectId` CHAR(36) NOT NULL,
    `purpose` ENUM('INTRODUCTION', 'QUESTION') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectPostPurpose_purpose_projectId_idx`(`purpose`, `projectId`),
    PRIMARY KEY (`projectId`, `purpose`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectRequestedRole` (
    `projectId` CHAR(36) NOT NULL,
    `role` ENUM('DEVELOPER', 'PLANNER', 'DESIGNER', 'MARKETER', 'OPERATOR', 'USER_TESTER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectRequestedRole_role_projectId_idx`(`role`, `projectId`),
    PRIMARY KEY (`projectId`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectLink` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
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
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `position` SMALLINT UNSIGNED NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectImage_projectId_position_idx`(`projectId`, `position`),
    UNIQUE INDEX `ProjectImage_projectId_url_key`(`projectId`, `url`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
