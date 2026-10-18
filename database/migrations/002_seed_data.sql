-- ====================================================================
-- GULF TAXIS DISPATCH CLOUD - SEED DATA
-- Migration: 002_seed_data.sql
-- ====================================================================

-- 1. Insert Vehicles (All 8 mandatory vehicle types)
INSERT INTO `vehicles` (`id`, `uuid`, `registration_no`, `make_model`, `vehicle_type`, `passenger_capacity`, `luggage_capacity`, `availability`, `maintenance_notes`) VALUES
(1, UUID(), 'DXB-K-4921', 'Toyota Camry Hybrid 2024', 'Sedan', 4, 3, 'available', 'Standard clean condition, full tank'),
(2, UUID(), 'DXB-L-8832', 'Lexus ES 350 Luxury', 'Business Sedan', 4, 3, 'available', 'VIP leather interior, bottled water and mints'),
(3, UUID(), 'AUH-5-7721', 'Toyota Land Cruiser VXR', 'SUV', 6, 5, 'available', 'Desert and executive highway ready'),
(4, UUID(), 'DXB-M-9910', 'GMC Yukon Denali XL', 'GMC', 7, 6, 'available', 'Presidential black edition with privacy tints'),
(5, UUID(), 'DXB-P-3314', 'Toyota HiAce GL Minivan', 'Minivan', 10, 8, 'available', 'Spacious family luggage compartment'),
(6, UUID(), 'DXB-V-1209', 'Mercedes-Benz V-Class Extra-Long', 'Van', 7, 7, 'available', 'Conference seating, ambient lighting'),
(7, UUID(), 'SHJ-2-6644', 'Toyota Coaster Luxury 22', 'Coaster', 22, 18, 'available', 'Group transfer with dual air conditioning'),
(8, UUID(), 'DXB-B-5501', 'Mercedes-Benz Tourismo Coach', 'Bus', 50, 45, 'available', 'Full tour coach with PA system')
ON DUPLICATE KEY UPDATE `make_model` = VALUES(`make_model`);

-- 2. Insert Drivers
INSERT INTO `drivers` (`id`, `uuid`, `name`, `phone`, `whatsapp`, `license_no`, `status`, `availability`, `rating`, `notes`) VALUES
(1, UUID(), 'Tariq Mansoor', '+971 50 123 4567', '+971 50 123 4567', 'UAE-COMM-89102', 'active', 'on_duty', 4.9, 'Airport VIP specialist, English & Arabic fluent'),
(2, UUID(), 'Rashid Al-Nuaimi', '+971 55 987 6543', '+971 55 987 6543', 'UAE-COMM-44519', 'active', 'on_duty', 5.0, 'Senior chauffeur, luxury protocol certified'),
(3, UUID(), 'Muhammad Imran', '+971 52 334 1122', '+971 52 334 1122', 'UAE-COMM-77312', 'active', 'on_duty', 4.8, 'Executive sedan driver, punctuality commended'),
(4, UUID(), 'Farhan Qureshi', '+971 56 445 8899', '+971 56 445 8899', 'UAE-COMM-66201', 'active', 'on_duty', 4.9, 'GMC and heavy SUV trained'),
(5, UUID(), 'Kareem Mostafa', '+971 50 887 2233', '+971 50 887 2233', 'UAE-COMM-99120', 'active', 'off_duty', 4.7, 'Available for night airport shifts'),
(6, UUID(), 'Bilal Hassan', '+971 54 221 6677', '+971 54 221 6677', 'UAE-COMM-33291', 'active', 'on_duty', 4.8, 'Tour group and Coaster specialist')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Assign primary vehicles to drivers
UPDATE `vehicles` SET `assigned_driver_id` = 1 WHERE `id` = 2; -- Lexus ES to Tariq
UPDATE `vehicles` SET `assigned_driver_id` = 4 WHERE `id` = 4; -- GMC to Farhan
UPDATE `vehicles` SET `assigned_driver_id` = 3 WHERE `id` = 1; -- Camry to Imran
UPDATE `vehicles` SET `assigned_driver_id` = 2 WHERE `id` = 3; -- Land Cruiser to Rashid

-- 3. System settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('company_name', 'Gulf Taxis Dispatch Cloud'),
('support_phone', '+971 4 800 4853'),
('support_email', 'dispatch@gulftaxis.com'),
('currency', 'AED'),
('timezone', 'Asia/Dubai'),
('auto_conflict_check', 'true')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Record migration 002
INSERT INTO `schema_migrations` (`version`, `description`)
VALUES ('002_seed_data', 'Initial seed data for vehicles, drivers, and system configurations')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);
