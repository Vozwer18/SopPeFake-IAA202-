CREATE TABLE `uploaded_images` (
    `filename` VARCHAR(80) NOT NULL,
    `content` MEDIUMBLOB NOT NULL,
    `content_type` VARCHAR(32) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    PRIMARY KEY (`filename`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
