
USE soppe_fake;

SET FOREIGN_KEY_CHECKS = 0;


-- ==========================
-- USERS (10)
-- ==========================

INSERT INTO users
(username,full_name,email,phone,password_hash,role)
VALUES

('admin01','Admin Sộp Pe','admin@soppe.vn','0900000001','123456','admin'),

('quynh01','Bùi Hữu Quỳnh','quynh@gmail.com','0900000002','123456','seller'),

('an01','Nguyễn Trường An','an@gmail.com','0900000003','123456','seller'),

('khanh01','Nguyễn Ngọc Gia Khánh','khanh@gmail.com','0900000004','123456','seller'),

('user01','Nguyễn Văn Minh','minh@gmail.com','0900000005','123456','customer'),

('user02','Trần Thị Lan','lan@gmail.com','0900000006','123456','customer'),

('user03','Phạm Đức Anh','anh@gmail.com','0900000007','123456','customer'),

('user04','Lê Hoàng Nam','nam@gmail.com','0900000008','123456','customer'),

('user05','Vũ Thu Hà','ha@gmail.com','0900000009','123456','customer'),

('user06','Đặng Minh Tú','tu@gmail.com','0900000010','123456','customer');


-- ==========================
-- SELLERS (3)
-- ==========================

INSERT INTO sellers
(user_id,seller_name,status)
VALUES

(2,'Quynh Official Store','active'),

(3,'An Technology Store','active'),

(4,'Khanh Fashion Group','active');


-- ==========================
-- SHOPS (6)
-- ==========================

INSERT INTO shops
(seller_id,shop_name,description,rating,status)
VALUES

(1,'Quynh Electronic','Thiết bị điện tử chính hãng',4.8,'active'),

(1,'Quynh Home','Đồ gia dụng thông minh',4.7,'active'),

(2,'An Mobile','Điện thoại và phụ kiện',4.9,'active'),

(2,'An Gaming','Gaming gear',4.6,'active'),

(3,'Khanh Fashion','Thời trang nam nữ',4.8,'active'),

(3,'Khanh Beauty','Mỹ phẩm chăm sóc cá nhân',4.7,'active');


-- ==========================
-- BRANDS
-- ==========================

INSERT INTO brands(name)
VALUES

('Apple'),
('Samsung'),
('Sony'),
('Nike'),
('Adidas'),
('Logitech'),
('Xiaomi'),
('Canon');


-- ==========================
-- CATEGORIES
-- ==========================

INSERT INTO categories(name)
VALUES

('Điện tử'),
('Gia dụng'),
('Thời trang'),
('Mỹ phẩm'),
('Gaming'),
('Phụ kiện');


-- ==========================
-- PRODUCTS (~70)
-- ==========================

INSERT INTO products
(shop_id,brand_id,name,description,status)
VALUES

(1,1,'iPhone 15 Pro','Điện thoại Apple cao cấp','active'),
(1,2,'Samsung Galaxy S25','Điện thoại Samsung','active'),
(1,3,'Tai nghe Sony WH1000','Tai nghe chống ồn','active'),
(1,7,'Robot hút bụi Xiaomi','Thiết bị gia đình','active'),
(1,6,'Chuột Logitech Gaming','Chuột gaming','active'),

(2,7,'Nồi cơm điện Xiaomi','Gia dụng nhà bếp','active'),
(2,7,'Máy lọc không khí Xiaomi','Thiết bị lọc khí','active'),
(2,7,'Camera Xiaomi Home','Camera an ninh','active'),

(3,1,'iPhone 16','Smartphone mới','active'),
(3,2,'Samsung Tablet','Máy tính bảng','active'),
(3,3,'Loa Bluetooth Sony','Loa di động','active'),

(4,6,'Bàn phím Gaming RGB','Bàn phím cơ','active'),
(4,6,'Tai nghe Gaming','Tai nghe chơi game','active'),
(4,6,'Webcam Gaming','Camera streaming','active'),

(5,4,'Áo Nike Hoodie','Áo thể thao','active'),
(5,5,'Giày Adidas Sport','Giày thể thao','active'),
(5,4,'Quần Nike Jogger','Quần thể thao','active'),

(6,1,'Kem dưỡng da','Mỹ phẩm chăm sóc da','active'),
(6,1,'Son môi cao cấp','Mỹ phẩm','active'),
(6,1,'Sữa rửa mặt','Chăm sóc da','active');


-- thêm sản phẩm mẫu tự động
INSERT INTO products
(shop_id,name,description,status)
SELECT
1,
CONCAT('Sản phẩm điện tử ',n),
'Nguyên mẫu sản phẩm',
'active'
FROM
(
SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
) x;


-- ==========================
-- VOUCHER
-- ==========================

INSERT INTO vouchers
(code,name,voucher_type,discount_type,discount_value,min_order_amount,status)
VALUES

('SALE10','Giảm 10% toàn sàn','platform','percent',10,10000,'active'),

('SHOP20','Shop giảm 20k','shop','fixed',20000,50000,'active'),

('SHIP30','Giảm phí vận chuyển','shipping','fixed',30000,0,'active');


-- ==========================
-- FLASH SALE
-- ==========================

INSERT INTO flash_sales
(name,start_time,end_time,status)
VALUES

('Sale lớn hôm nay',
NOW(),
DATE_ADD(NOW(),INTERVAL 5 HOUR),
'active');


-- ==========================
-- REVIEWS
-- ==========================

INSERT INTO reviews
(user_id,product_id,rating,comment,status)
VALUES

(5,1,5,'Sản phẩm rất tốt','visible'),

(6,2,4,'Giao hàng nhanh','visible'),

(7,3,5,'Âm thanh tuyệt vời','visible');


SET FOREIGN_KEY_CHECKS = 1;
