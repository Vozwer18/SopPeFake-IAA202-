USE soppe_fake;

SET FOREIGN_KEY_CHECKS=0;


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 1, 'iPhone 15 Pro', 'Sản phẩm iPhone 15 Pro chất lượng cao', 'active', 4.6, 347);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(1, 'SKU-0001', 236000, '/products/product-1.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(1, 'image', '/products/product-1.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(1, 1, 51, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 2, 'Samsung Galaxy S25', 'Sản phẩm Samsung Galaxy S25 chất lượng cao', 'active', 4.7, 394);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(2, 'SKU-0002', 273000, '/products/product-2.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(2, 'image', '/products/product-2.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(2, 2, 52, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 1, 'iPhone 16', 'Sản phẩm iPhone 16 chất lượng cao', 'active', 4.8, 441);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(3, 'SKU-0003', 310000, '/products/product-3.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(3, 'image', '/products/product-3.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(3, 3, 53, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 2, 'Samsung Tablet', 'Sản phẩm Samsung Tablet chất lượng cao', 'active', 4.9, 488);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(4, 'SKU-0004', 347000, '/products/product-4.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(4, 'image', '/products/product-4.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(4, 4, 54, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 3, 'MacBook Air M4', 'Sản phẩm MacBook Air M4 chất lượng cao', 'active', 4.5, 535);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(5, 'SKU-0005', 384000, '/products/product-5.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(5, 'image', '/products/product-5.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(5, 5, 55, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 4, 'Laptop Gaming ASUS', 'Sản phẩm Laptop Gaming ASUS chất lượng cao', 'active', 4.6, 582);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(6, 'SKU-0006', 421000, '/products/product-6.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(6, 'image', '/products/product-6.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(6, 6, 56, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 5, 'Tai nghe Sony WH1000', 'Sản phẩm Tai nghe Sony WH1000 chất lượng cao', 'active', 4.7, 629);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(7, 'SKU-0007', 458000, '/products/product-7.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(7, 'image', '/products/product-7.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(7, 7, 57, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 5, 'AirPods Pro', 'Sản phẩm AirPods Pro chất lượng cao', 'active', 4.8, 676);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(8, 'SKU-0008', 495000, '/products/product-8.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(8, 'image', '/products/product-8.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(8, 8, 58, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 6, 'Loa Bluetooth Sony', 'Sản phẩm Loa Bluetooth Sony chất lượng cao', 'active', 4.9, 723);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(9, 'SKU-0009', 532000, '/products/product-9.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(9, 'image', '/products/product-9.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(9, 9, 59, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 7, 'Camera Xiaomi', 'Sản phẩm Camera Xiaomi chất lượng cao', 'active', 4.5, 770);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(10, 'SKU-0010', 569000, '/products/product-10.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(10, 'image', '/products/product-10.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(10, 10, 60, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 8, 'Apple Watch Series 10', 'Sản phẩm Apple Watch Series 10 chất lượng cao', 'active', 4.6, 817);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(11, 'SKU-0011', 606000, '/products/product-11.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(11, 'image', '/products/product-11.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(11, 11, 61, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 9, 'iPad Air', 'Sản phẩm iPad Air chất lượng cao', 'active', 4.7, 864);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(12, 'SKU-0012', 643000, '/products/product-12.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(12, 'image', '/products/product-12.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(12, 12, 62, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 10, 'Chuột Logitech MX', 'Sản phẩm Chuột Logitech MX chất lượng cao', 'active', 4.8, 911);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(13, 'SKU-0013', 680000, '/products/product-13.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(13, 'image', '/products/product-13.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(13, 13, 63, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 11, 'Bàn phím cơ Keychron', 'Sản phẩm Bàn phím cơ Keychron chất lượng cao', 'active', 4.9, 958);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(14, 'SKU-0014', 717000, '/products/product-14.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(14, 'image', '/products/product-14.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(14, 14, 64, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 12, 'Màn hình LG 27 inch', 'Sản phẩm Màn hình LG 27 inch chất lượng cao', 'active', 4.5, 1005);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(15, 'SKU-0015', 754000, '/products/product-15.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(15, 'image', '/products/product-15.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(15, 15, 65, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 13, 'Ổ cứng SSD Samsung', 'Sản phẩm Ổ cứng SSD Samsung chất lượng cao', 'active', 4.6, 1052);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(16, 'SKU-0016', 791000, '/products/product-16.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(16, 'image', '/products/product-16.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(16, 16, 66, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 14, 'Sạc nhanh Anker', 'Sản phẩm Sạc nhanh Anker chất lượng cao', 'active', 4.7, 1099);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(17, 'SKU-0017', 828000, '/products/product-17.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(17, 'image', '/products/product-17.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(17, 17, 67, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 15, 'Cáp USB Type C', 'Sản phẩm Cáp USB Type C chất lượng cao', 'active', 4.8, 1146);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(18, 'SKU-0018', 865000, '/products/product-18.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(18, 'image', '/products/product-18.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(18, 18, 68, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 16, 'Máy ảnh Canon', 'Sản phẩm Máy ảnh Canon chất lượng cao', 'active', 4.9, 1193);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(19, 'SKU-0019', 902000, '/products/product-19.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(19, 'image', '/products/product-19.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(19, 19, 69, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(1, 17, 'Flycam DJI', 'Sản phẩm Flycam DJI chất lượng cao', 'active', 4.5, 1240);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(20, 'SKU-0020', 939000, '/products/product-20.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(20, 'image', '/products/product-20.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(20, 20, 70, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 18, 'Robot hút bụi Xiaomi', 'Sản phẩm Robot hút bụi Xiaomi chất lượng cao', 'active', 4.6, 1287);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(21, 'SKU-0021', 976000, '/products/product-21.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(21, 'image', '/products/product-21.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(21, 21, 71, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 19, 'Máy lọc không khí', 'Sản phẩm Máy lọc không khí chất lượng cao', 'active', 4.7, 1334);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(22, 'SKU-0022', 1013000, '/products/product-22.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(22, 'image', '/products/product-22.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(22, 22, 72, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 20, 'Nồi cơm điện Sharp', 'Sản phẩm Nồi cơm điện Sharp chất lượng cao', 'active', 4.8, 1381);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(23, 'SKU-0023', 1050000, '/products/product-23.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(23, 'image', '/products/product-23.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(23, 23, 73, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 21, 'Bếp điện Sunhouse', 'Sản phẩm Bếp điện Sunhouse chất lượng cao', 'active', 4.9, 1428);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(24, 'SKU-0024', 1087000, '/products/product-24.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(24, 'image', '/products/product-24.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(24, 24, 74, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 22, 'Quạt thông minh', 'Sản phẩm Quạt thông minh chất lượng cao', 'active', 4.5, 1475);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(25, 'SKU-0025', 1124000, '/products/product-25.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(25, 'image', '/products/product-25.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(25, 25, 75, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 23, 'Đèn ngủ LED', 'Sản phẩm Đèn ngủ LED chất lượng cao', 'active', 4.6, 1522);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(26, 'SKU-0026', 1161000, '/products/product-26.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(26, 'image', '/products/product-26.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(26, 26, 76, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 24, 'Máy xay sinh tố', 'Sản phẩm Máy xay sinh tố chất lượng cao', 'active', 4.7, 1569);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(27, 'SKU-0027', 1198000, '/products/product-27.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(27, 'image', '/products/product-27.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(27, 27, 77, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 25, 'Ấm siêu tốc', 'Sản phẩm Ấm siêu tốc chất lượng cao', 'active', 4.8, 1616);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(28, 'SKU-0028', 1235000, '/products/product-28.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(28, 'image', '/products/product-28.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(28, 28, 78, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 26, 'Máy hút bụi mini', 'Sản phẩm Máy hút bụi mini chất lượng cao', 'active', 4.9, 1663);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(29, 'SKU-0029', 1272000, '/products/product-29.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(29, 'image', '/products/product-29.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(29, 29, 79, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 27, 'Bình giữ nhiệt', 'Sản phẩm Bình giữ nhiệt chất lượng cao', 'active', 4.5, 1710);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(30, 'SKU-0030', 1309000, '/products/product-30.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(30, 'image', '/products/product-30.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(30, 30, 80, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 28, 'Kệ nhà bếp', 'Sản phẩm Kệ nhà bếp chất lượng cao', 'active', 4.6, 1757);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(31, 'SKU-0031', 1346000, '/products/product-31.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(31, 'image', '/products/product-31.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(31, 31, 81, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(2, 29, 'Chảo chống dính', 'Sản phẩm Chảo chống dính chất lượng cao', 'active', 4.7, 1804);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(32, 'SKU-0032', 1383000, '/products/product-32.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(32, 'image', '/products/product-32.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(32, 32, 82, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 30, 'Xiaomi Redmi Note 15', 'Sản phẩm Xiaomi Redmi Note 15 chất lượng cao', 'active', 4.8, 1851);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(33, 'SKU-0033', 1420000, '/products/product-33.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(33, 'image', '/products/product-33.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(33, 33, 83, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 31, 'Oppo Reno', 'Sản phẩm Oppo Reno chất lượng cao', 'active', 4.9, 1898);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(34, 'SKU-0034', 1457000, '/products/product-34.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(34, 'image', '/products/product-34.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(34, 34, 84, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 32, 'Vivo V Series', 'Sản phẩm Vivo V Series chất lượng cao', 'active', 4.5, 1945);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(35, 'SKU-0035', 1494000, '/products/product-35.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(35, 'image', '/products/product-35.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(35, 35, 85, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 33, 'Realme GT', 'Sản phẩm Realme GT chất lượng cao', 'active', 4.6, 1992);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(36, 'SKU-0036', 1531000, '/products/product-36.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(36, 'image', '/products/product-36.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(36, 36, 86, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 34, 'Samsung A Series', 'Sản phẩm Samsung A Series chất lượng cao', 'active', 4.7, 2039);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(37, 'SKU-0037', 1568000, '/products/product-37.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(37, 'image', '/products/product-37.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(37, 37, 87, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 35, 'Tablet Lenovo', 'Sản phẩm Tablet Lenovo chất lượng cao', 'active', 4.8, 2086);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(38, 'SKU-0038', 1605000, '/products/product-38.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(38, 'image', '/products/product-38.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(38, 38, 88, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 36, 'Điện thoại Nokia', 'Sản phẩm Điện thoại Nokia chất lượng cao', 'active', 4.9, 2133);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(39, 'SKU-0039', 1642000, '/products/product-39.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(39, 'image', '/products/product-39.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(39, 39, 89, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 37, 'Phụ kiện điện thoại', 'Sản phẩm Phụ kiện điện thoại chất lượng cao', 'active', 4.5, 2180);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(40, 'SKU-0040', 1679000, '/products/product-40.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(40, 'image', '/products/product-40.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(40, 40, 90, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 38, 'Pin dự phòng', 'Sản phẩm Pin dự phòng chất lượng cao', 'active', 4.6, 2227);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(41, 'SKU-0041', 1716000, '/products/product-41.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(41, 'image', '/products/product-41.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(41, 41, 91, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(3, 39, 'Kính cường lực', 'Sản phẩm Kính cường lực chất lượng cao', 'active', 4.7, 2274);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(42, 'SKU-0042', 1753000, '/products/product-42.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(42, 'image', '/products/product-42.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(42, 42, 92, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 40, 'Bàn phím Gaming RGB', 'Sản phẩm Bàn phím Gaming RGB chất lượng cao', 'active', 4.8, 2321);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(43, 'SKU-0043', 1790000, '/products/product-43.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(43, 'image', '/products/product-43.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(43, 43, 93, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 41, 'Chuột Gaming RGB', 'Sản phẩm Chuột Gaming RGB chất lượng cao', 'active', 4.9, 2368);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(44, 'SKU-0044', 1827000, '/products/product-44.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(44, 'image', '/products/product-44.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(44, 44, 94, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 42, 'Tai nghe Gaming', 'Sản phẩm Tai nghe Gaming chất lượng cao', 'active', 4.5, 2415);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(45, 'SKU-0045', 1864000, '/products/product-45.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(45, 'image', '/products/product-45.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(45, 45, 95, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 43, 'Ghế Gaming', 'Sản phẩm Ghế Gaming chất lượng cao', 'active', 4.6, 2462);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(46, 'SKU-0046', 1901000, '/products/product-46.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(46, 'image', '/products/product-46.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(46, 46, 96, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 44, 'Webcam Full HD', 'Sản phẩm Webcam Full HD chất lượng cao', 'active', 4.7, 2509);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(47, 'SKU-0047', 1938000, '/products/product-47.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(47, 'image', '/products/product-47.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(47, 47, 97, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 45, 'Pad chuột Gaming', 'Sản phẩm Pad chuột Gaming chất lượng cao', 'active', 4.8, 2556);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(48, 'SKU-0048', 1975000, '/products/product-48.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(48, 'image', '/products/product-48.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(48, 48, 98, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 46, 'Micro Gaming', 'Sản phẩm Micro Gaming chất lượng cao', 'active', 4.9, 2603);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(49, 'SKU-0049', 2012000, '/products/product-49.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(49, 'image', '/products/product-49.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(49, 49, 99, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 47, 'Card màn hình', 'Sản phẩm Card màn hình chất lượng cao', 'active', 4.5, 2650);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(50, 'SKU-0050', 2049000, '/products/product-50.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(50, 'image', '/products/product-50.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(50, 50, 100, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 48, 'Tay cầm Game', 'Sản phẩm Tay cầm Game chất lượng cao', 'active', 4.6, 2697);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(51, 'SKU-0051', 2086000, '/products/product-51.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(51, 'image', '/products/product-51.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(51, 51, 101, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(4, 49, 'Đèn RGB', 'Sản phẩm Đèn RGB chất lượng cao', 'active', 4.7, 2744);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(52, 'SKU-0052', 2123000, '/products/product-52.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(52, 'image', '/products/product-52.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(52, 52, 102, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 50, 'Áo Hoodie', 'Sản phẩm Áo Hoodie chất lượng cao', 'active', 4.8, 2791);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(53, 'SKU-0053', 2160000, '/products/product-53.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(53, 'image', '/products/product-53.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(53, 53, 103, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 51, 'Áo Nike Sport', 'Sản phẩm Áo Nike Sport chất lượng cao', 'active', 4.9, 2838);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(54, 'SKU-0054', 2197000, '/products/product-54.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(54, 'image', '/products/product-54.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(54, 54, 104, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 52, 'Giày Adidas Sport', 'Sản phẩm Giày Adidas Sport chất lượng cao', 'active', 4.5, 2885);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(55, 'SKU-0055', 2234000, '/products/product-55.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(55, 'image', '/products/product-55.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(55, 55, 105, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 53, 'Quần Jogger', 'Sản phẩm Quần Jogger chất lượng cao', 'active', 4.6, 2932);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(56, 'SKU-0056', 2271000, '/products/product-56.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(56, 'image', '/products/product-56.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(56, 56, 106, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 54, 'Áo khoác Unisex', 'Sản phẩm Áo khoác Unisex chất lượng cao', 'active', 4.7, 2979);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(57, 'SKU-0057', 2308000, '/products/product-57.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(57, 'image', '/products/product-57.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(57, 57, 107, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 55, 'Túi xách thời trang', 'Sản phẩm Túi xách thời trang chất lượng cao', 'active', 4.8, 3026);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(58, 'SKU-0058', 2345000, '/products/product-58.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(58, 'image', '/products/product-58.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(58, 58, 108, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 56, 'Mũ thời trang', 'Sản phẩm Mũ thời trang chất lượng cao', 'active', 4.9, 3073);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(59, 'SKU-0059', 2382000, '/products/product-59.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(59, 'image', '/products/product-59.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(59, 59, 109, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 57, 'Giày Sneaker', 'Sản phẩm Giày Sneaker chất lượng cao', 'active', 4.5, 3120);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(60, 'SKU-0060', 2419000, '/products/product-60.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(60, 'image', '/products/product-60.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(60, 60, 110, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 58, 'Áo Polo', 'Sản phẩm Áo Polo chất lượng cao', 'active', 4.6, 3167);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(61, 'SKU-0061', 2456000, '/products/product-61.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(61, 'image', '/products/product-61.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(61, 61, 111, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(5, 59, 'Quần Jeans', 'Sản phẩm Quần Jeans chất lượng cao', 'active', 4.7, 3214);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(62, 'SKU-0062', 2493000, '/products/product-62.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(62, 'image', '/products/product-62.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(62, 62, 112, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 60, 'Son môi cao cấp', 'Sản phẩm Son môi cao cấp chất lượng cao', 'active', 4.8, 3261);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(63, 'SKU-0063', 2530000, '/products/product-63.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(63, 'image', '/products/product-63.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(63, 63, 113, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 61, 'Kem dưỡng da', 'Sản phẩm Kem dưỡng da chất lượng cao', 'active', 4.9, 3308);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(64, 'SKU-0064', 2567000, '/products/product-64.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(64, 'image', '/products/product-64.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(64, 64, 114, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 62, 'Serum Vitamin C', 'Sản phẩm Serum Vitamin C chất lượng cao', 'active', 4.5, 3355);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(65, 'SKU-0065', 2604000, '/products/product-65.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(65, 'image', '/products/product-65.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(65, 65, 115, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 63, 'Sữa rửa mặt', 'Sản phẩm Sữa rửa mặt chất lượng cao', 'active', 4.6, 3402);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(66, 'SKU-0066', 2641000, '/products/product-66.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(66, 'image', '/products/product-66.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(66, 66, 116, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 64, 'Kem chống nắng', 'Sản phẩm Kem chống nắng chất lượng cao', 'active', 4.7, 3449);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(67, 'SKU-0067', 2678000, '/products/product-67.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(67, 'image', '/products/product-67.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(67, 67, 117, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 65, 'Mặt nạ dưỡng da', 'Sản phẩm Mặt nạ dưỡng da chất lượng cao', 'active', 4.8, 3496);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(68, 'SKU-0068', 2715000, '/products/product-68.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(68, 'image', '/products/product-68.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(68, 68, 118, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 66, 'Nước hoa nữ', 'Sản phẩm Nước hoa nữ chất lượng cao', 'active', 4.9, 3543);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(69, 'SKU-0069', 2752000, '/products/product-69.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(69, 'image', '/products/product-69.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(69, 69, 119, 0);


INSERT INTO products
(shop_id, brand_id, name, description, status, rating, sold_quantity)
VALUES
(6, 67, 'Dầu gội chăm sóc tóc', 'Sản phẩm Dầu gội chăm sóc tóc chất lượng cao', 'active', 4.5, 3590);


INSERT INTO product_variants
(product_id, sku, price, image, status)
VALUES
(70, 'SKU-0070', 2789000, '/products/product-70.jpg', 'active');


INSERT INTO product_media
(product_id, media_type, url, is_thumbnail, sort_order)
VALUES
(70, 'image', '/products/product-70.jpg', 1, 1);


INSERT INTO inventories
(product_id, variant_id, quantity, reserved_quantity)
VALUES
(70, 70, 120, 0);


SET FOREIGN_KEY_CHECKS=1;