-- Run against the database explicitly selected by the MySQL client.
-- Adds missing indexes only; preserves data and configured system values.
-- Compatible with MySQL 8 and safe to rerun after Prisma db:push.

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_email'),
  'DO 0',
  'CREATE INDEX idx_users_email ON users(email)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_phone'),
  'DO 0',
  'CREATE INDEX idx_users_phone ON users(phone)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'shops' AND index_name = 'idx_shops_seller'),
  'DO 0',
  'CREATE INDEX idx_shops_seller ON shops(seller_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'shops' AND index_name = 'idx_shops_status'),
  'DO 0',
  'CREATE INDEX idx_shops_status ON shops(status)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_shop'),
  'DO 0',
  'CREATE INDEX idx_products_shop ON products(shop_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_name'),
  'DO 0',
  'CREATE INDEX idx_products_name ON products(name)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'products' AND index_name = 'idx_products_status'),
  'DO 0',
  'CREATE INDEX idx_products_status ON products(status)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'product_media' AND index_name = 'idx_product_media_product'),
  'DO 0',
  'CREATE INDEX idx_product_media_product ON product_media(product_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_user'),
  'DO 0',
  'CREATE INDEX idx_orders_user ON orders(user_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_status'),
  'DO 0',
  'CREATE INDEX idx_orders_status ON orders(status)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'orders' AND index_name = 'idx_orders_created'),
  'DO 0',
  'CREATE INDEX idx_orders_created ON orders(created_at)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_order_items_order'),
  'DO 0',
  'CREATE INDEX idx_order_items_order ON order_items(order_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'order_items' AND index_name = 'idx_order_items_product'),
  'DO 0',
  'CREATE INDEX idx_order_items_product ON order_items(product_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'idx_reviews_product'),
  'DO 0',
  'CREATE INDEX idx_reviews_product ON reviews(product_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'idx_reviews_user'),
  'DO 0',
  'CREATE INDEX idx_reviews_user ON reviews(user_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'messages' AND index_name = 'idx_messages_conversation'),
  'DO 0',
  'CREATE INDEX idx_messages_conversation ON messages(conversation_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'messages' AND index_name = 'idx_messages_sender'),
  'DO 0',
  'CREATE INDEX idx_messages_sender ON messages(sender_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'notifications' AND index_name = 'idx_notifications_user'),
  'DO 0',
  'CREATE INDEX idx_notifications_user ON notifications(user_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'vouchers' AND index_name = 'idx_vouchers_code'),
  'DO 0',
  'CREATE INDEX idx_vouchers_code ON vouchers(code)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'vouchers' AND index_name = 'idx_vouchers_status'),
  'DO 0',
  'CREATE INDEX idx_vouchers_status ON vouchers(status)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'flash_sales' AND index_name = 'idx_flashsale_time'),
  'DO 0',
  'CREATE INDEX idx_flashsale_time ON flash_sales(start_time,end_time)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'inventories' AND index_name = 'idx_inventory_variant'),
  'DO 0',
  'CREATE INDEX idx_inventory_variant ON inventories(variant_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'search_histories' AND index_name = 'idx_search_keyword'),
  'DO 0',
  'CREATE INDEX idx_search_keyword ON search_histories(keyword)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

SET @soppe_index_sql = IF(
  EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'product_views' AND index_name = 'idx_product_views_product'),
  'DO 0',
  'CREATE INDEX idx_product_views_product ON product_views(product_id)'
);
PREPARE soppe_index_stmt FROM @soppe_index_sql;
EXECUTE soppe_index_stmt;
DEALLOCATE PREPARE soppe_index_stmt;

CREATE TABLE IF NOT EXISTS system_configs (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE,
    config_value VARCHAR(255),
    description TEXT
);

INSERT INTO system_configs (config_key, config_value, description)
SELECT 'platform_fee', '5', 'Phí sàn (%)'
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'platform_fee');

INSERT INTO system_configs (config_key, config_value, description)
SELECT 'withdraw_fee', '10000', 'Phí rút tiền'
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'withdraw_fee');

INSERT INTO system_configs (config_key, config_value, description)
SELECT 'seller_hold_days', '7', 'Số ngày giữ tiền sau giao hàng'
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'seller_hold_days');

INSERT INTO system_configs (config_key, config_value, description)
SELECT 'default_shipping_fee', '30000', 'Phí ship mặc định'
WHERE NOT EXISTS (SELECT 1 FROM system_configs WHERE config_key = 'default_shipping_fee');
