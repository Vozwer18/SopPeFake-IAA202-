-- =====================================================
-- SOPPE FAKE FINAL DATABASE V2
-- MySQL 8.0+
-- Fixed table creation order for Foreign Keys
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS soppe_fake
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE soppe_fake;

CREATE TABLE users (

    user_id INT AUTO_INCREMENT PRIMARY KEY,


    username VARCHAR(50) UNIQUE,


    full_name VARCHAR(100) NOT NULL,


    email VARCHAR(100) UNIQUE NOT NULL,


    phone VARCHAR(20),


    password_hash VARCHAR(255) NOT NULL,


    avatar VARCHAR(255),


    role ENUM(
        'customer',
        'seller',
        'admin'
    )
    DEFAULT 'customer',


    status ENUM(
        'active',
        'blocked',
        'pending'
    )
    DEFAULT 'active',


    last_login DATETIME,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

);

-- sellers



CREATE TABLE brands (

    brand_id INT AUTO_INCREMENT PRIMARY KEY,


    name VARCHAR(100) NOT NULL,


    logo VARCHAR(255),


    description TEXT,


    status ENUM(
        'active',
        'inactive'
    )
    DEFAULT 'active',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP

);
-- categories



CREATE TABLE categories (

    category_id INT AUTO_INCREMENT PRIMARY KEY,


    parent_id INT,


    name VARCHAR(100) NOT NULL,


    image VARCHAR(255),


    description TEXT,


    status ENUM(
        'active',
        'inactive'
    )
    DEFAULT 'active',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(parent_id)

    REFERENCES categories(category_id)

);

-- product_category_map



CREATE TABLE attributes (

    attribute_id INT AUTO_INCREMENT PRIMARY KEY,


    name VARCHAR(100) NOT NULL,


    type ENUM(
        'text',
        'number',
        'select'
    )
    DEFAULT 'text'

);

-- product_attributes


CREATE TABLE logistics_zones (

    zone_id INT AUTO_INCREMENT PRIMARY KEY,

    zone_code VARCHAR(10) UNIQUE NOT NULL,

    zone_name VARCHAR(100) NOT NULL,

    description TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- provinces


CREATE TABLE shipping_providers (

    provider_id INT AUTO_INCREMENT PRIMARY KEY,


    name VARCHAR(100),


    logo VARCHAR(255),


    hotline VARCHAR(20),


    status ENUM(
        'active',
        'inactive'
    )
    DEFAULT 'active'

);

-- shipping_services



CREATE TABLE vouchers (

    voucher_id INT AUTO_INCREMENT PRIMARY KEY,


    code VARCHAR(50) UNIQUE NOT NULL,


    name VARCHAR(255),


    voucher_type ENUM(

        'platform',

        'shop',

        'product',

        'shipping'

    ),


    discount_type ENUM(

        'percent',

        'fixed'

    ),


    discount_value DECIMAL(12,2),


    min_order_amount DECIMAL(12,0),


    max_discount_amount DECIMAL(12,0),


    quantity INT,


    used_quantity INT DEFAULT 0,


    start_time DATETIME,


    end_time DATETIME,


    status ENUM(

        'active',

        'expired',

        'disabled'

    )
    DEFAULT 'active',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- user_vouchers



CREATE TABLE flash_sales (

    flashsale_id INT AUTO_INCREMENT PRIMARY KEY,


    name VARCHAR(255),


    start_time DATETIME,


    end_time DATETIME,


    status ENUM(

        'upcoming',

        'active',

        'finished',

        'cancelled'

    )
    DEFAULT 'upcoming',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- flashsale_products



CREATE TABLE banners (

    banner_id INT AUTO_INCREMENT PRIMARY KEY,


    title VARCHAR(255),


    image_url VARCHAR(500),


    redirect_type ENUM(

        'product',

        'category',

        'flashsale',

        'voucher',

        'external'

    ),


    redirect_id INT,


    position ENUM(

        'homepage_main',

        'homepage_small',

        'category',

        'product'

    ),


    start_time DATETIME,


    end_time DATETIME,


    status ENUM(

        'active',

        'expired',

        'disabled'

    )
    DEFAULT 'active',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- reviews



CREATE TABLE wallet_transactions (

    transaction_id INT AUTO_INCREMENT PRIMARY KEY,


    wallet_type ENUM(

        'shop',

        'seller'

    ),


    wallet_id INT NOT NULL,


    transaction_type ENUM(

        'income',

        'withdraw',

        'transfer',

        'refund',

        'fee'

    ),


    amount DECIMAL(12,0),


    reference_type VARCHAR(50),


    reference_id INT,


    description TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- withdrawal_requests


CREATE TABLE roles (

    role_id INT AUTO_INCREMENT PRIMARY KEY,


    role_name VARCHAR(100) NOT NULL,


    description TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
-- permission



CREATE TABLE permissions (

    permission_id INT AUTO_INCREMENT PRIMARY KEY,


    permission_code VARCHAR(100) UNIQUE,


    permission_name VARCHAR(150),


    description TEXT

);

-- role_permissions



CREATE TABLE search_keywords (

    keyword_id INT AUTO_INCREMENT PRIMARY KEY,


    keyword VARCHAR(255),


    search_count INT DEFAULT 0,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- trending



CREATE TABLE customer_segments (

    segment_id INT AUTO_INCREMENT PRIMARY KEY,


    name VARCHAR(100),


    description TEXT

);

CREATE TABLE sellers (

    seller_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL UNIQUE,


    seller_name VARCHAR(100),


    identity_number VARCHAR(50),


    email_business VARCHAR(100),


    phone_business VARCHAR(20),


    status ENUM(

        'pending',

        'active',

        'suspended'

    )
    DEFAULT 'pending',


    verified_at DATETIME,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

    ON DELETE CASCADE

);

-- shops


CREATE TABLE addresses (

    address_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    receiver_name VARCHAR(100) NOT NULL,


    receiver_phone VARCHAR(20) NOT NULL,


    province VARCHAR(100) NOT NULL,


    district VARCHAR(100) NOT NULL,


    ward VARCHAR(100) NOT NULL,


    detail_address VARCHAR(255),


    address_type ENUM(

        'home',

        'office',

        'other'

    )
    DEFAULT 'home',


    is_default BOOLEAN DEFAULT FALSE,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

    ON DELETE CASCADE

);


-- =====================================================
-- 2. PRODUCT MODULE
-- =====================================================

-- brands


CREATE TABLE carts (

    cart_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    status ENUM(

        'active',

        'checked_out',

        'abandoned'

    )
    DEFAULT 'active',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

    ON DELETE CASCADE

);
-- cart_items



CREATE TABLE provinces (

    province_id INT AUTO_INCREMENT PRIMARY KEY,


    zone_id INT NOT NULL,


    province_name VARCHAR(100) NOT NULL,


    province_code VARCHAR(20),



    FOREIGN KEY(zone_id)

    REFERENCES logistics_zones(zone_id)

);
-- shipping_providers



CREATE TABLE shipping_services (

    service_id INT AUTO_INCREMENT PRIMARY KEY,


    provider_id INT NOT NULL,


    service_name VARCHAR(100),


    service_type ENUM(

        'normal',

        'fast',

        'express'

    ),


    base_fee DECIMAL(12,0),


    estimated_days INT,



    FOREIGN KEY(provider_id)

    REFERENCES shipping_providers(provider_id)

);

-- shipping_zone_rules


CREATE TABLE shipping_zone_rules (

    zone_rule_id INT AUTO_INCREMENT PRIMARY KEY,


    from_zone INT NOT NULL,


    to_zone INT NOT NULL,


    distance_level ENUM(

        'same',

        'near',

        'medium',

        'far',

        'very_far'

    ),



    FOREIGN KEY(from_zone)

    REFERENCES logistics_zones(zone_id),



    FOREIGN KEY(to_zone)

    REFERENCES logistics_zones(zone_id)

);

-- shipping_price_rules



CREATE TABLE user_vouchers (

    user_voucher_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    voucher_id INT NOT NULL,


    status ENUM(

        'available',

        'used',

        'expired',

        'removed'

    )
    DEFAULT 'available',


    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    expired_at DATETIME,


    used_at DATETIME,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id),



    FOREIGN KEY(voucher_id)

    REFERENCES vouchers(voucher_id)

);

-- voucher_shop



CREATE TABLE notifications (

    notification_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    title VARCHAR(255),


    content TEXT,


    notification_type ENUM(

        'order',

        'voucher',

        'flashsale',

        'chat',

        'system'

    ),


    reference_id INT,


    is_read BOOLEAN DEFAULT FALSE,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

);



-- =====================================================
-- 9. FINANCE MODULE
-- =====================================================

-- shop_wallets


CREATE TABLE role_permissions (

    role_id INT,


    permission_id INT,


    PRIMARY KEY(
        role_id,
        permission_id
    ),


    FOREIGN KEY(role_id)

    REFERENCES roles(role_id),


    FOREIGN KEY(permission_id)

    REFERENCES permissions(permission_id)

);

-- user_roles



CREATE TABLE user_roles (

    user_id INT,


    role_id INT,


    PRIMARY KEY(
        user_id,
        role_id
    ),


    FOREIGN KEY(user_id)

    REFERENCES users(user_id),


    FOREIGN KEY(role_id)

    REFERENCES roles(role_id)

);

-- seller_verifications



CREATE TABLE reports (

    report_id INT AUTO_INCREMENT PRIMARY KEY,


    reporter_id INT NOT NULL,


    target_type ENUM(

        'product',

        'shop',

        'seller',

        'user'

    ),


    target_id INT,


    reason VARCHAR(255),


    description TEXT,


    status ENUM(

        'pending',

        'processing',

        'resolved',

        'rejected'

    )
    DEFAULT 'pending',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(reporter_id)

    REFERENCES users(user_id)

);

-- complaints



CREATE TABLE admin_logs (

    log_id INT AUTO_INCREMENT PRIMARY KEY,


    admin_id INT NOT NULL,


    action_type VARCHAR(100) NOT NULL,


    target_type VARCHAR(100),


    target_id INT,


    description TEXT,


    ip_address VARCHAR(50),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(admin_id)

    REFERENCES users(user_id)

);
-- search_histories



CREATE TABLE search_histories (

    search_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT,


    keyword VARCHAR(255) NOT NULL,


    search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

);

-- login_histories



CREATE TABLE login_histories (

    login_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    login_method ENUM(

        'password',

        'google',

        'facebook',

        'otp'

    )
    DEFAULT 'password',


    device VARCHAR(255),


    ip_address VARCHAR(50),


    location VARCHAR(100),


    status ENUM(

        'success',

        'failed'

    )
    DEFAULT 'success',


    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id)

);




-- =====================================================
-- Analytics system module
-- =====================================================

-- PRODUCT_VIEWS



CREATE TABLE shops (

    shop_id INT AUTO_INCREMENT PRIMARY KEY,


    seller_id INT NOT NULL,


    shop_name VARCHAR(150) NOT NULL,


    shop_logo VARCHAR(255),


    shop_banner VARCHAR(255),


    description TEXT,


    rating DECIMAL(2,1)
    DEFAULT 0,


    total_products INT DEFAULT 0,


    followers INT DEFAULT 0,


    status ENUM(

        'active',

        'inactive',

        'banned'

    )
    DEFAULT 'active',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(seller_id)

    REFERENCES sellers(seller_id)

    ON DELETE CASCADE

);

-- addresses



CREATE TABLE orders (

    order_id INT AUTO_INCREMENT PRIMARY KEY,


    order_code VARCHAR(50) UNIQUE NOT NULL,


    user_id INT NOT NULL,


    address_id INT NOT NULL,


    subtotal DECIMAL(12,0),


    shipping_fee DECIMAL(12,0) DEFAULT 0,


    discount_amount DECIMAL(12,0) DEFAULT 0,


    total_amount DECIMAL(12,0),



    status ENUM(

        'pending',

        'confirmed',

        'packing',

        'shipping',

        'completed',

        'cancelled',

        'refund'

    )
    DEFAULT 'pending',


    note TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id),



    FOREIGN KEY(address_id)

    REFERENCES addresses(address_id)

);

-- order_items



CREATE TABLE shipping_price_rules (

    price_rule_id INT AUTO_INCREMENT PRIMARY KEY,


    service_id INT NOT NULL,


    distance_level ENUM(

        'same',

        'near',

        'medium',

        'far',

        'very_far'

    ),


    min_weight DECIMAL(10,2),


    max_weight DECIMAL(10,2),


    price DECIMAL(12,0),



    FOREIGN KEY(service_id)

    REFERENCES shipping_services(service_id)

);

-- packages



CREATE TABLE voucher_shipping (

    voucher_id INT,


    service_id INT,


    PRIMARY KEY(
        voucher_id,
        service_id
    ),


    FOREIGN KEY(voucher_id)

    REFERENCES vouchers(voucher_id),


    FOREIGN KEY(service_id)

    REFERENCES shipping_services(service_id)

);

-- coupon_usage



CREATE TABLE conversations (

    conversation_id INT AUTO_INCREMENT PRIMARY KEY,


    buyer_id INT NOT NULL,


    seller_id INT NOT NULL,


    status ENUM(

        'active',

        'closed',

        'blocked'

    )
    DEFAULT 'active',


    last_message_at DATETIME,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(buyer_id)

    REFERENCES users(user_id),



    FOREIGN KEY(seller_id)

    REFERENCES sellers(seller_id)

);

-- messages



CREATE TABLE seller_wallets (

    wallet_id INT AUTO_INCREMENT PRIMARY KEY,


    seller_id INT NOT NULL,


    balance DECIMAL(12,0)
    DEFAULT 0,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(seller_id)

    REFERENCES sellers(seller_id)

);
-- seller_bank_accounts



CREATE TABLE seller_bank_accounts (

    bank_account_id INT AUTO_INCREMENT PRIMARY KEY,


    seller_id INT NOT NULL,


    bank_name VARCHAR(100),


    account_number VARCHAR(100),


    account_holder VARCHAR(100),


    branch VARCHAR(100),


    status ENUM(

        'active',

        'inactive'

    )
    DEFAULT 'active',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(seller_id)

    REFERENCES sellers(seller_id)

);

-- wallet_transactions



CREATE TABLE seller_balance_history (

    history_id INT AUTO_INCREMENT PRIMARY KEY,


    seller_id INT NOT NULL,


    period_month DATE,


    total_sales DECIMAL(12,0),


    platform_fee DECIMAL(12,0),


    refund_amount DECIMAL(12,0),


    final_amount DECIMAL(12,0),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(seller_id)

    REFERENCES sellers(seller_id)

);


-- =====================================================
-- 10. ADMIN / SYSTEM MODULE
-- =====================================================

-- roles



CREATE TABLE seller_verifications (

    verification_id INT AUTO_INCREMENT PRIMARY KEY,


    seller_id INT NOT NULL,


    document_type VARCHAR(100),


    document_url VARCHAR(500),


    status ENUM(

        'pending',

        'approved',

        'rejected'

    )
    DEFAULT 'pending',


    note TEXT,


    verified_by INT,


    verified_at DATETIME,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(seller_id)

    REFERENCES sellers(seller_id),


    FOREIGN KEY(verified_by)

    REFERENCES users(user_id)

);

-- product_moderations



CREATE TABLE products (

    product_id INT AUTO_INCREMENT PRIMARY KEY,


    shop_id INT NOT NULL,


    brand_id INT,


    name VARCHAR(255) NOT NULL,


    description TEXT,


    status ENUM(

        'draft',

        'active',

        'hidden',

        'banned'

    )
    DEFAULT 'draft',


    rating DECIMAL(2,1)
    DEFAULT 0,


    sold_quantity INT DEFAULT 0,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id),



    FOREIGN KEY(brand_id)

    REFERENCES brands(brand_id)

);
-- product_media (image/video)



CREATE TABLE payments (

    payment_id INT AUTO_INCREMENT PRIMARY KEY,


    order_id INT UNIQUE NOT NULL,


    payment_method ENUM(

        'COD',

        'BANK',

        'VNPAY',

        'MOMO',

        'WALLET'

    ),


    amount DECIMAL(12,0),


    payment_status ENUM(

        'pending',

        'paid',

        'failed',

        'refunded'

    )
    DEFAULT 'pending',


    transaction_code VARCHAR(100),


    paid_at DATETIME,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(order_id)

    REFERENCES orders(order_id)

);


-- order_status_history


CREATE TABLE order_status_history (

    history_id INT AUTO_INCREMENT PRIMARY KEY,


    order_id INT NOT NULL,


    old_status VARCHAR(50),


    new_status VARCHAR(50),


    note TEXT,


    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(order_id)

    REFERENCES orders(order_id)

    ON DELETE CASCADE

);

-- =====================================================
-- 5. SHIPPING MODULE
-- =====================================================

-- logistics_zones



CREATE TABLE packages (

    package_id INT AUTO_INCREMENT PRIMARY KEY,


    order_id INT NOT NULL,


    weight DECIMAL(10,2),


    length DECIMAL(10,2),


    width DECIMAL(10,2),


    height DECIMAL(10,2),


    volume_weight DECIMAL(10,2),



    FOREIGN KEY(order_id)

    REFERENCES orders(order_id)

);

-- shipments



CREATE TABLE shop_addresses (

    shop_address_id INT AUTO_INCREMENT PRIMARY KEY,


    shop_id INT NOT NULL,


    province_id INT NOT NULL,


    district VARCHAR(100),


    ward VARCHAR(100),


    detail_address TEXT,


    is_default BOOLEAN DEFAULT FALSE,


    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id),


    FOREIGN KEY(province_id)

    REFERENCES provinces(province_id)

);

-- =====================================================
-- 6. VOUCHER MODULE
-- =====================================================

-- vouchers


CREATE TABLE voucher_shop (

    voucher_id INT,


    shop_id INT,


    PRIMARY KEY(
        voucher_id,
        shop_id
    ),


    FOREIGN KEY(voucher_id)

    REFERENCES vouchers(voucher_id),


    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id)

);
-- voucher_product



CREATE TABLE coupon_usage (

    usage_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT,


    voucher_id INT,


    order_id INT,


    discount_amount DECIMAL(12,0),


    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(user_id),


    FOREIGN KEY(voucher_id)

    REFERENCES vouchers(voucher_id),


    FOREIGN KEY(order_id)

    REFERENCES orders(order_id)

);
-- =====================================================
-- 7. FLASH SALE MODULE
-- =====================================================

-- flash_sales



CREATE TABLE messages (

    message_id INT AUTO_INCREMENT PRIMARY KEY,


    conversation_id INT NOT NULL,


    sender_id INT NOT NULL,


    message_type ENUM(

        'text',

        'image',

        'video',

        'product'

    )
    DEFAULT 'text',


    content TEXT,


    file_url VARCHAR(500),


    is_read BOOLEAN DEFAULT FALSE,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(conversation_id)

    REFERENCES conversations(conversation_id)
    ON DELETE CASCADE,



    FOREIGN KEY(sender_id)

    REFERENCES users(user_id)

);

-- notifications



CREATE TABLE shop_wallets (

    wallet_id INT AUTO_INCREMENT PRIMARY KEY,


    shop_id INT NOT NULL,


    available_balance DECIMAL(12,0)
    DEFAULT 0,


    pending_balance DECIMAL(12,0)
    DEFAULT 0,


    frozen_balance DECIMAL(12,0)
    DEFAULT 0,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id)

);
-- seller_wallets



CREATE TABLE withdrawal_requests (

    withdrawal_id INT AUTO_INCREMENT PRIMARY KEY,


    seller_id INT NOT NULL,


    bank_account_id INT NOT NULL,


    amount DECIMAL(12,0),


    status ENUM(

        'pending',

        'approved',

        'processing',

        'completed',

        'rejected'

    )
    DEFAULT 'pending',


    note TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    completed_at DATETIME,



    FOREIGN KEY(seller_id)

    REFERENCES sellers(seller_id),



    FOREIGN KEY(bank_account_id)

    REFERENCES seller_bank_accounts(bank_account_id)

);

-- seller_balance_history



CREATE TABLE complaints (

    complaint_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    order_id INT,


    type ENUM(

        'refund',

        'missing_item',

        'wrong_item',

        'shipping',

        'other'

    ),


    description TEXT,


    evidence VARCHAR(500),


    status ENUM(

        'pending',

        'processing',

        'resolved',

        'rejected'

    )
    DEFAULT 'pending',


    handled_by INT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(user_id),


    FOREIGN KEY(order_id)

    REFERENCES orders(order_id),


    FOREIGN KEY(handled_by)

    REFERENCES users(user_id)

);

-- admin_logs



CREATE TABLE shop_statistics (

    statistic_id INT AUTO_INCREMENT PRIMARY KEY,


    shop_id INT,


    total_orders INT DEFAULT 0,


    total_revenue DECIMAL(12,0),


    total_products INT,


    total_visits INT,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id)

);

-- daily_sales_reports



CREATE TABLE daily_sales_reports (

    report_id INT AUTO_INCREMENT PRIMARY KEY,


    shop_id INT,


    report_date DATE,


    total_orders INT,


    revenue DECIMAL(12,0),


    refund_amount DECIMAL(12,0),


    profit DECIMAL(12,0),


    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id)

);

-- search_keywords



CREATE TABLE product_category_map (

    product_id INT,


    category_id INT,


    PRIMARY KEY(
        product_id,
        category_id
    ),



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)
    ON DELETE CASCADE,



    FOREIGN KEY(category_id)

    REFERENCES categories(category_id)
    ON DELETE CASCADE

);


-- products


CREATE TABLE product_media (

    media_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT NOT NULL,


    media_type ENUM(

        'image',

        'video'

    )
    DEFAULT 'image',


    url VARCHAR(500) NOT NULL,


    is_thumbnail BOOLEAN DEFAULT FALSE,


    sort_order INT DEFAULT 0,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

    ON DELETE CASCADE

);

-- variant_groups



CREATE TABLE variant_groups (

    group_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT NOT NULL,


    name VARCHAR(100) NOT NULL,



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

    ON DELETE CASCADE

);

-- variant_options



CREATE TABLE product_variants (

    variant_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT NOT NULL,


    sku VARCHAR(100) UNIQUE,


    price DECIMAL(12,0) NOT NULL,


    image VARCHAR(255),


    status ENUM(
        'active',
        'inactive'
    )
    DEFAULT 'active',



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

    ON DELETE CASCADE

);


-- attributes



CREATE TABLE product_attributes (

    product_id INT,


    attribute_id INT,


    value VARCHAR(255),



    PRIMARY KEY(
        product_id,
        attribute_id
    ),



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)
    ON DELETE CASCADE,



    FOREIGN KEY(attribute_id)

    REFERENCES attributes(attribute_id)
    ON DELETE CASCADE

);

-- inventories



CREATE TABLE inventory_transactions (

    transaction_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT,


    variant_id INT,


    transaction_type ENUM(

        'import',

        'export',

        'adjust'

    ),


    quantity INT,


    note VARCHAR(255),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

);



-- =====================================================
-- 3. CART MODULE
-- =====================================================

-- carts



CREATE TABLE shipments (

    shipment_id INT AUTO_INCREMENT PRIMARY KEY,


    order_id INT NOT NULL,


    package_id INT,


    provider_id INT,


    service_id INT,


    tracking_code VARCHAR(100),


    shipping_fee DECIMAL(12,0),


    status ENUM(

        'created',

        'picked',

        'shipping',

        'delivered',

        'failed'

    )
    DEFAULT 'created',



    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(order_id)

    REFERENCES orders(order_id),


    FOREIGN KEY(package_id)

    REFERENCES packages(package_id),


    FOREIGN KEY(provider_id)

    REFERENCES shipping_providers(provider_id),


    FOREIGN KEY(service_id)

    REFERENCES shipping_services(service_id)

);

-- shipping_tracking



CREATE TABLE voucher_product (

    voucher_id INT,


    product_id INT,


    PRIMARY KEY(
        voucher_id,
        product_id
    ),


    FOREIGN KEY(voucher_id)

    REFERENCES vouchers(voucher_id),


    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

);

-- voucher_shipping



CREATE TABLE flashsale_products (

    id INT AUTO_INCREMENT PRIMARY KEY,


    flashsale_id INT NOT NULL,


    shop_id INT NOT NULL,


    product_id INT NOT NULL,


    original_price DECIMAL(12,0),


    sale_price DECIMAL(12,0),


    quantity INT,


    sold_quantity INT DEFAULT 0,



    FOREIGN KEY(flashsale_id)

    REFERENCES flash_sales(flashsale_id),



    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id),



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

);
-- =====================================================
-- 8. SOCIAL MODULE
-- =====================================================

-- banners



CREATE TABLE reviews (

    review_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    product_id INT NOT NULL,


    order_id INT,


    rating INT NOT NULL,


    comment TEXT,


    status ENUM(

        'visible',

        'hidden',

        'pending'

    )
    DEFAULT 'pending',


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(user_id)

    REFERENCES users(user_id),



    FOREIGN KEY(product_id)

    REFERENCES products(product_id),



    FOREIGN KEY(order_id)

    REFERENCES orders(order_id)


);
-- review_media



CREATE TABLE wishlists (

    wishlist_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    product_id INT NOT NULL,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    UNIQUE(
        user_id,
        product_id
    ),



    FOREIGN KEY(user_id)

    REFERENCES users(user_id),



    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

);


-- conversations



CREATE TABLE product_moderations (

    moderation_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT NOT NULL,


    admin_id INT,


    action ENUM(

        'approve',

        'reject',

        'hide'

    ),


    reason TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(product_id)

    REFERENCES products(product_id),


    FOREIGN KEY(admin_id)

    REFERENCES users(user_id)

);

-- reports



CREATE TABLE product_views (

    view_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    product_id INT NOT NULL,

    session_id VARCHAR(100),

    view_duration INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)
    REFERENCES users(user_id),


    FOREIGN KEY(product_id)
    REFERENCES products(product_id)

);

-- user_behaviors



CREATE TABLE user_behaviors (

    behavior_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT,

    product_id INT,

    behavior_type ENUM(

        'view',

        'cart',

        'wishlist',

        'purchase',

        'review'

    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)
    REFERENCES users(user_id),


    FOREIGN KEY(product_id)
    REFERENCES products(product_id)

);

-- recommedation_logs



CREATE TABLE recommendation_logs (

    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT,


    product_id INT,


    recommendation_type ENUM(

        'similar',

        'popular',

        'personal',

        'trending'

    ),


    score DECIMAL(5,2),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(user_id),


    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

);

-- product_statistics



CREATE TABLE product_statistics (

    statistic_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT,


    total_views INT DEFAULT 0,


    total_sales INT DEFAULT 0,


    total_favorites INT DEFAULT 0,


    average_rating DECIMAL(2,1),


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

);

-- shop_statistics



CREATE TABLE trending_products (

    trending_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT,


    ranking INT,


    period_date DATE,


    score DECIMAL(10,2),


    FOREIGN KEY(product_id)

    REFERENCES products(product_id)

);

-- customer_segments


CREATE TABLE variant_options (

    option_id INT AUTO_INCREMENT PRIMARY KEY,


    group_id INT NOT NULL,


    value VARCHAR(100) NOT NULL,


    FOREIGN KEY(group_id)

    REFERENCES variant_groups(group_id)

    ON DELETE CASCADE

);


-- product_variants



CREATE TABLE inventories (

    inventory_id INT AUTO_INCREMENT PRIMARY KEY,


    product_id INT NOT NULL,


    variant_id INT,


    quantity INT DEFAULT 0,


    reserved_quantity INT DEFAULT 0,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,



    FOREIGN KEY(product_id)

    REFERENCES products(product_id),



    FOREIGN KEY(variant_id)

    REFERENCES product_variants(variant_id)

);

-- inventory_transactions



CREATE TABLE cart_items (

    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,


    cart_id INT NOT NULL,


    product_id INT NOT NULL,


    variant_id INT,


    quantity INT DEFAULT 1,


    added_price DECIMAL(12,0),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(cart_id)

    REFERENCES carts(cart_id)

    ON DELETE CASCADE,


    FOREIGN KEY(product_id)

    REFERENCES products(product_id),


    FOREIGN KEY(variant_id)

    REFERENCES product_variants(variant_id)

);

-- =====================================================
-- 4. ORDER MODULE
-- =====================================================

-- orders



CREATE TABLE order_items (

    order_item_id INT AUTO_INCREMENT PRIMARY KEY,


    order_id INT NOT NULL,


    product_id INT NOT NULL,


    variant_id INT,


    shop_id INT NOT NULL,


    product_name VARCHAR(255),


    variant_name VARCHAR(255),


    quantity INT,


    price DECIMAL(12,0),


    subtotal DECIMAL(12,0),



    FOREIGN KEY(order_id)

    REFERENCES orders(order_id)

    ON DELETE CASCADE,


    FOREIGN KEY(product_id)

    REFERENCES products(product_id),


    FOREIGN KEY(variant_id)

    REFERENCES product_variants(variant_id),


    FOREIGN KEY(shop_id)

    REFERENCES shops(shop_id)

);

-- payments



CREATE TABLE shipping_tracking (

    tracking_id INT AUTO_INCREMENT PRIMARY KEY,


    shipment_id INT NOT NULL,


    status VARCHAR(100),


    location VARCHAR(100),


    note TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(shipment_id)

    REFERENCES shipments(shipment_id)

);


-- shop_addresses


CREATE TABLE review_media (

    media_id INT AUTO_INCREMENT PRIMARY KEY,


    review_id INT NOT NULL,


    media_type ENUM(

        'image',

        'video'

    ),


    url VARCHAR(500),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,



    FOREIGN KEY(review_id)

    REFERENCES reviews(review_id)

    ON DELETE CASCADE

);

-- wishlists


SET FOREIGN_KEY_CHECKS = 1;
