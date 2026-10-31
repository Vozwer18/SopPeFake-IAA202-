ALTER TABLE `reviews`
    ADD COLUMN `seller_reply` TEXT NULL,
    ADD COLUMN `seller_reply_at` TIMESTAMP(0) NULL,
    ADD COLUMN `seller_reply_updated_at` TIMESTAMP(0) NULL;
