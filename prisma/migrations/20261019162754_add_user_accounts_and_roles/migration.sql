-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `nickname` VARCHAR(10) NULL,
    `introduction` VARCHAR(60) NULL,
    `primaryRole` ENUM('DEVELOPER', 'PLANNER', 'DESIGNER', 'MARKETER', 'OPERATOR', 'USER_TESTER') NULL,
    `isOnboardingCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_nickname_key`(`nickname`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialAccount` (
    `id` CHAR(36) NOT NULL,
    `provider` ENUM('APPLE', 'KAKAO') NOT NULL,
    `providerUserId` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SocialAccount_userId_idx`(`userId`),
    UNIQUE INDEX `SocialAccount_provider_providerUserId_key`(`provider`, `providerUserId`),
    UNIQUE INDEX `SocialAccount_userId_provider_key`(`userId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSecondaryRole` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `role` ENUM('DEVELOPER', 'PLANNER', 'DESIGNER', 'MARKETER', 'OPERATOR', 'USER_TESTER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserSecondaryRole_userId_idx`(`userId`),
    UNIQUE INDEX `UserSecondaryRole_userId_role_key`(`userId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SocialAccount` ADD CONSTRAINT `SocialAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSecondaryRole` ADD CONSTRAINT `UserSecondaryRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
