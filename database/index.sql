
USE soppe_fake;

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================
-- PERFORMANCE INDEX
-- ==========================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

CREATE INDEX idx_shops_seller ON shops(seller_id);
CREATE INDEX idx_shops_status ON shops(status);

CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_status ON products(status);

CREATE INDEX idx_product_media_product ON product_media(product_id);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_status ON vouchers(status);

CREATE INDEX idx_flashsale_time
ON flash_sales(start_time,end_time);

CREATE INDEX idx_inventory_variant
ON inventories(variant_id);

CREATE INDEX idx_search_keyword
ON search_histories(keyword);

CREATE INDEX idx_product_views_product
ON product_views(product_id);


-- ==========================
-- SYSTEM CONFIG
-- ==========================

CREATE TABLE IF NOT EXISTS system_configs (

    config_id INT AUTO_INCREMENT PRIMARY KEY,

    config_key VARCHAR(100) UNIQUE,

    config_value VARCHAR(255),

    description TEXT

);


INSERT INTO system_configs
(config_key,config_value,description)
VALUES

('platform_fee','5','Phí sàn (%)'),

('withdraw_fee','10000','Phí rút tiền'),

('seller_hold_days','7','Số ngày giữ tiền sau giao hàng'),

('default_shipping_fee','30000','Phí ship mặc định');


SET FOREIGN_KEY_CHECKS = 1;
