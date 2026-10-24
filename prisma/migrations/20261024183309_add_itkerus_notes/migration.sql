-- CreateTable
CREATE TABLE `ITkerusNote` (
    `id` CHAR(36) NOT NULL,
    `projectId` CHAR(36) NOT NULL,
    `authorId` CHAR(36) NOT NULL,
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
ALTER TABLE `ITkerusNote` ADD CONSTRAINT `ITkerusNote_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `ProjectPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ITkerusNote` ADD CONSTRAINT `ITkerusNote_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
