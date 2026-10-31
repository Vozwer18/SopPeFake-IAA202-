ALTER TABLE `shops` ADD COLUMN `payment_qr_url` VARCHAR(500) NULL;
ALTER TABLE `orders`
    ADD COLUMN `payment_qr_url` VARCHAR(500) NULL,
    ADD COLUMN `checkout_token` VARCHAR(80) NULL;
CREATE UNIQUE INDEX `uq_orders_checkout_token` ON `orders`(`checkout_token`);
