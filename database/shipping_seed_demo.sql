-- Optional demo data for the shipping UI/API. Run only when the shipping tables are empty.
INSERT INTO logistics_zones(zone_code,zone_name,description) VALUES
('MB','Miền Bắc','Khu vực miền Bắc'),('MT','Miền Trung','Khu vực miền Trung'),('MN','Miền Nam','Khu vực miền Nam')
ON DUPLICATE KEY UPDATE zone_name=VALUES(zone_name);

INSERT INTO provinces(zone_id,province_name,province_code)
SELECT zone_id,'Hà Nội','HN' FROM logistics_zones WHERE zone_code='MB' AND NOT EXISTS(SELECT 1 FROM provinces WHERE province_name='Hà Nội');
INSERT INTO provinces(zone_id,province_name,province_code)
SELECT zone_id,'Hải Phòng','HP' FROM logistics_zones WHERE zone_code='MB' AND NOT EXISTS(SELECT 1 FROM provinces WHERE province_name='Hải Phòng');
INSERT INTO provinces(zone_id,province_name,province_code)
SELECT zone_id,'Đà Nẵng','DN' FROM logistics_zones WHERE zone_code='MT' AND NOT EXISTS(SELECT 1 FROM provinces WHERE province_name='Đà Nẵng');
INSERT INTO provinces(zone_id,province_name,province_code)
SELECT zone_id,'TP Hồ Chí Minh','HCM' FROM logistics_zones WHERE zone_code='MN' AND NOT EXISTS(SELECT 1 FROM provinces WHERE province_name='TP Hồ Chí Minh');
INSERT INTO provinces(zone_id,province_name,province_code)
SELECT zone_id,'Cần Thơ','CT' FROM logistics_zones WHERE zone_code='MN' AND NOT EXISTS(SELECT 1 FROM provinces WHERE province_name='Cần Thơ');

INSERT INTO shipping_zone_rules(from_zone,to_zone,distance_level)
SELECT a.zone_id,b.zone_id,CASE WHEN a.zone_id=b.zone_id THEN 'same' WHEN (a.zone_code='MB' AND b.zone_code='MT') OR (a.zone_code='MT' AND b.zone_code IN ('MB','MN')) OR (a.zone_code='MN' AND b.zone_code='MT') THEN 'medium' ELSE 'far' END
FROM logistics_zones a CROSS JOIN logistics_zones b
WHERE NOT EXISTS(SELECT 1 FROM shipping_zone_rules z WHERE z.from_zone=a.zone_id AND z.to_zone=b.zone_id);

INSERT INTO shipping_providers(name,hotline,status)
SELECT 'SopPe Express','1900 0001','active' WHERE NOT EXISTS(SELECT 1 FROM shipping_providers WHERE name='SopPe Express');
INSERT INTO shipping_providers(name,hotline,status)
SELECT 'Fast Delivery','1900 0002','active' WHERE NOT EXISTS(SELECT 1 FROM shipping_providers WHERE name='Fast Delivery');

INSERT INTO shipping_services(provider_id,service_name,service_type,base_fee,estimated_days)
SELECT provider_id,'Tiêu chuẩn','normal',15000,3 FROM shipping_providers p WHERE p.name='SopPe Express' AND NOT EXISTS(SELECT 1 FROM shipping_services s WHERE s.provider_id=p.provider_id AND s.service_name='Tiêu chuẩn');
INSERT INTO shipping_services(provider_id,service_name,service_type,base_fee,estimated_days)
SELECT provider_id,'Nhanh','fast',25000,2 FROM shipping_providers p WHERE p.name='SopPe Express' AND NOT EXISTS(SELECT 1 FROM shipping_services s WHERE s.provider_id=p.provider_id AND s.service_name='Nhanh');
INSERT INTO shipping_services(provider_id,service_name,service_type,base_fee,estimated_days)
SELECT provider_id,'Hỏa tốc','express',45000,1 FROM shipping_providers p WHERE p.name='Fast Delivery' AND NOT EXISTS(SELECT 1 FROM shipping_services s WHERE s.provider_id=p.provider_id AND s.service_name='Hỏa tốc');

INSERT INTO shipping_price_rules(service_id,distance_level,min_weight,max_weight,price)
SELECT service_id,'same',0,1,12000 FROM shipping_services s WHERE s.service_name='Tiêu chuẩn' AND NOT EXISTS(SELECT 1 FROM shipping_price_rules r WHERE r.service_id=s.service_id AND r.distance_level='same' AND r.min_weight=0 AND r.max_weight=1);
INSERT INTO shipping_price_rules(service_id,distance_level,min_weight,max_weight,price)
SELECT service_id,'medium',0,1,22000 FROM shipping_services s WHERE s.service_name='Tiêu chuẩn' AND NOT EXISTS(SELECT 1 FROM shipping_price_rules r WHERE r.service_id=s.service_id AND r.distance_level='medium' AND r.min_weight=0 AND r.max_weight=1);
INSERT INTO shipping_price_rules(service_id,distance_level,min_weight,max_weight,price)
SELECT service_id,'far',0,1,32000 FROM shipping_services s WHERE s.service_name='Tiêu chuẩn' AND NOT EXISTS(SELECT 1 FROM shipping_price_rules r WHERE r.service_id=s.service_id AND r.distance_level='far' AND r.min_weight=0 AND r.max_weight=1);
