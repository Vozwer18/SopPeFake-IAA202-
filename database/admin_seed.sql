
USE soppe_fake;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- ADMIN SYSTEM SEED
-- Super Admin: admin01 full permission
-- =====================================================


-- ==========================
-- ROLES
-- ==========================

INSERT INTO roles
(role_name, description)
VALUES

('Super Admin',
'Toan quyen quan tri he thong'),

('Product Admin',
'Quan ly va kiem duyet san pham'),

('Seller Manager',
'Quan ly seller va shop'),

('Customer Support',
'Xu ly cham soc khach hang'),

('Finance Admin',
'Quan ly thanh toan va vi tien');


-- ==========================
-- PERMISSIONS
-- ==========================

INSERT INTO permissions
(permission_code, permission_name, description)
VALUES

('user.view','Xem nguoi dung',''),

('user.create','Tao nguoi dung',''),

('user.update','Cap nhat nguoi dung',''),

('user.delete','Xoa nguoi dung',''),


('seller.view','Xem seller',''),

('seller.approve','Duyet seller',''),

('seller.update','Cap nhat seller',''),

('seller.block','Khoa seller',''),


('shop.view','Xem shop',''),

('shop.update','Sua shop',''),

('shop.block','Khoa shop',''),


('product.view','Xem san pham',''),

('product.create','Tao san pham',''),

('product.update','Sua san pham',''),

('product.delete','Xoa san pham',''),

('product.approve','Duyet san pham',''),

('product.hide','An san pham',''),


('category.manage','Quan ly danh muc',''),


('order.view','Xem don hang',''),

('order.update','Cap nhat don hang',''),

('order.cancel','Huy don hang',''),

('order.refund','Xu ly hoan tien',''),


('voucher.manage','Quan ly voucher',''),


('flashsale.manage','Quan ly flash sale',''),


('banner.manage','Quan ly banner',''),


('review.manage','Quan ly danh gia',''),


('chat.manage','Quan ly chat',''),


('wallet.view','Xem vi',''),

('withdraw.manage','Xu ly rut tien',''),


('report.manage','Xu ly bao cao',''),


('complaint.manage','Xu ly khieu nai',''),


('admin.manage','Quan ly admin',''),


('role.manage','Quan ly quyen',''),


('system.config','Cau hinh he thong',''),


('analytics.view','Xem thong ke',''),


('log.view','Xem he thong log','');



-- ==========================
-- SUPER ADMIN GET ALL PERMISSION
-- ==========================

INSERT INTO role_permissions
(role_id, permission_id)

SELECT

1,

permission_id

FROM permissions;



-- ==========================
-- ASSIGN admin01
-- ==========================

INSERT INTO user_roles
(user_id, role_id)

SELECT

user_id,

1

FROM users

WHERE username='admin01';



-- ==========================
-- SAMPLE OTHER ADMIN USERS
-- ==========================

INSERT INTO users
(username,full_name,email,phone,password_hash,role)

VALUES

('product_admin',
'Product Admin',
'product.admin@soppe.vn',
0900000020,
'123456',
'admin'),

('finance_admin',
'Finance Admin',
'finance.admin@soppe.vn',
0900000021,
'123456',
'admin');



INSERT INTO user_roles
(user_id,role_id)

SELECT

u.user_id,

r.role_id

FROM users u, roles r

WHERE u.username='product_admin'
AND r.role_name='Product Admin';


INSERT INTO user_roles
(user_id,role_id)

SELECT

u.user_id,

r.role_id

FROM users u, roles r

WHERE u.username='finance_admin'
AND r.role_name='Finance Admin';



-- ==========================
-- ADMIN LOGIN SAMPLE
-- ==========================

INSERT INTO login_histories
(user_id,login_method,device,status)

SELECT

user_id,

'password',

'Admin PC',

'success'

FROM users

WHERE username='admin01';



-- ==========================
-- ADMIN LOG SAMPLE
-- ==========================

INSERT INTO admin_logs
(admin_id,action_type,target_type,target_id,description)

SELECT

user_id,

'CREATE_SYSTEM',

'database',

1,

'Tao tai khoan Super Admin va phan quyen he thong'

FROM users

WHERE username='admin01';



SET FOREIGN_KEY_CHECKS = 1;
