-- ====================================================================
-- GULF TAXIS DISPATCH CLOUD - DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Compatible: Hostinger MySQL 8.0+ / MariaDB 10.5+
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Schema Migrations Tracker
CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NOT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. System Settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` ENUM('ADMINISTRATOR', 'DISPATCHER', 'BOOKING_AGENT') NOT NULL DEFAULT 'BOOKING_AGENT',
  `phone` VARCHAR(30) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Drivers Table
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `whatsapp` VARCHAR(30) NULL,
  `license_no` VARCHAR(50) NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `availability` ENUM('on_duty', 'off_duty', 'on_trip') NOT NULL DEFAULT 'on_duty',
  `rating` DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_drivers_availability` (`availability`),
  INDEX `idx_drivers_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Vehicles Table
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) NOT NULL UNIQUE,
  `registration_no` VARCHAR(50) NOT NULL UNIQUE,
  `make_model` VARCHAR(100) NOT NULL,
  `vehicle_type` ENUM('Sedan', 'Business Sedan', 'SUV', 'GMC', 'Minivan', 'Van', 'Coaster', 'Bus') NOT NULL DEFAULT 'Sedan',
  `passenger_capacity` SMALLINT UNSIGNED NOT NULL DEFAULT 4,
  `luggage_capacity` SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  `availability` ENUM('available', 'in_use', 'maintenance') NOT NULL DEFAULT 'available',
  `assigned_driver_id` INT UNSIGNED NULL,
  `maintenance_notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_vehicles_type` (`vehicle_type`),
  INDEX `idx_vehicles_availability` (`availability`),
  CONSTRAINT `fk_vehicles_driver` FOREIGN KEY (`assigned_driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bookings Table
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) NOT NULL UNIQUE,
  `booking_ref` VARCHAR(20) NOT NULL UNIQUE,
  `pickup_date` DATE NOT NULL,
  `pickup_time` TIME NOT NULL,
  `passenger_name` VARCHAR(100) NOT NULL,
  `passenger_phone` VARCHAR(30) NOT NULL,
  `passenger_whatsapp` VARCHAR(30) NULL,
  `passenger_email` VARCHAR(150) NULL,
  `flight_number` VARCHAR(30) NULL,
  `airline_terminal` VARCHAR(100) NULL,
  `pickup_location` VARCHAR(255) NOT NULL,
  `dropoff_location` VARCHAR(255) NOT NULL,
  `passenger_count` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `luggage_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `vehicle_type` ENUM('Sedan', 'Business Sedan', 'SUV', 'GMC', 'Minivan', 'Van', 'Coaster', 'Bus') NOT NULL DEFAULT 'Sedan',
  `assigned_driver_id` INT UNSIGNED NULL,
  `assigned_vehicle_id` INT UNSIGNED NULL,
  `booking_source` VARCHAR(50) NOT NULL DEFAULT 'Direct Call',
  `customer_notes` TEXT NULL,
  `driver_instructions` TEXT NULL,
  `status` ENUM(
    'Pending',
    'Confirmed',
    'Assigned',
    'Driver En Route',
    'Arrived',
    'Passenger Picked Up',
    'Completed',
    'Cancelled',
    'No Show'
  ) NOT NULL DEFAULT 'Pending',
  `internal_remarks` TEXT NULL,
  `created_by_user_id` INT UNSIGNED NULL,
  `last_updated_by_user_id` INT UNSIGNED NULL,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `cancelled_at` DATETIME NULL,
  `cancellation_reason` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_bookings_pickup` (`pickup_date`, `pickup_time`),
  INDEX `idx_bookings_status` (`status`),
  INDEX `idx_bookings_flight` (`flight_number`),
  INDEX `idx_bookings_driver` (`assigned_driver_id`),
  INDEX `idx_bookings_vehicle` (`assigned_vehicle_id`),
  CONSTRAINT `fk_bookings_driver` FOREIGN KEY (`assigned_driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bookings_vehicle` FOREIGN KEY (`assigned_vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bookings_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bookings_updater` FOREIGN KEY (`last_updated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Booking Assignments History
CREATE TABLE IF NOT EXISTS `booking_assignments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT UNSIGNED NOT NULL,
  `driver_id` INT UNSIGNED NOT NULL,
  `vehicle_id` INT UNSIGNED NULL,
  `assigned_by_user_id` INT UNSIGNED NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Assigned',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_assignments_booking` (`booking_id`),
  INDEX `idx_assignments_driver` (`driver_id`),
  CONSTRAINT `fk_assignments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignments_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assignments_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_assignments_user` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT UNSIGNED NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `details_json` LONGTEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_action` (`action`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Password Reset Tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_token_hash` (`token_hash`),
  CONSTRAINT `fk_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Record migration 001
INSERT INTO `schema_migrations` (`version`, `description`) 
VALUES ('001_initial_schema', 'Initial creation of core tables with constraints and indexes')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

SET FOREIGN_KEY_CHECKS = 1;
