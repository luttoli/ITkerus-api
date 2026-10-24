-- CreateIndex
CREATE INDEX `ProjectPost_deletedAt_createdAt_id_idx` ON `ProjectPost`(`deletedAt`, `createdAt`, `id`);
