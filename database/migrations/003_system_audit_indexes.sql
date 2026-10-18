-- ====================================================================
-- GULF TAXIS DISPATCH CLOUD - DATABASE MIGRATION
-- Migration: 003_system_audit_indexes.sql
-- Optimizes high-throughput dispatch queries and audit performance
-- ====================================================================

-- Composite index for fast dispatch dashboard queries
ALTER TABLE `bookings` 
ADD INDEX IF NOT EXISTS `idx_bookings_date_status` (`pickup_date`, `status`);

-- Composite index for rapid chauffeur conflict checking
ALTER TABLE `bookings` 
ADD INDEX IF NOT EXISTS `idx_bookings_driver_time` (`assigned_driver_id`, `pickup_date`, `pickup_time`);

-- Index for phone number search optimization
ALTER TABLE `bookings` 
ADD INDEX IF NOT EXISTS `idx_bookings_phone` (`passenger_phone`);

-- System setting for deployment versioning
INSERT INTO `system_settings` (`setting_key`, `setting_value`) 
VALUES ('system_schema_version', '1.0.3')
ON DUPLICATE KEY UPDATE `setting_value` = '1.0.3';
