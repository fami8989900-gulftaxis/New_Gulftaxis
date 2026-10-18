/**
 * Gulf Taxis Dispatch Cloud - Production ZIP Package Generator
 * Builds a ready-to-upload Hostinger deployment ZIP package in-browser using JSZip.
 */

import JSZip from 'jszip';

export async function generateHostingerZipPackage(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Root Hostinger README Guide
  zip.file(
    'HOSTINGER_INSTALLATION_GUIDE.txt',
    `====================================================================
GULF TAXIS DISPATCH CLOUD - HOSTINGER DEPLOYMENT & INSTALLATION GUIDE
====================================================================

Congratulations on acquiring Gulf Taxis Dispatch Cloud!
This package is engineered specifically for Hostinger Shared Hosting (Business/Cloud/Premium)
without requiring Node.js, VPS, Docker, or command-line terminal access.

DEPLOYMENT INSTRUCTIONS IN 6 SIMPLE STEPS:

STEP 1: Log in to Hostinger hPanel
- Open https://hpanel.hostinger.com
- Select your domain (e.g. yourdispatchdomain.com)
- Ensure PHP version is set to 8.2 or 8.3 (Advanced -> PHP Configuration)
- Ensure SSL (HTTPS) is activated for your domain (Security -> SSL)

STEP 2: Create a MySQL Database in Hostinger
- Navigate to "Databases" -> "Management"
- Enter MySQL Database name: e.g. "u123456789_dispatch"
- Enter MySQL Username: e.g. "u123456789_admin"
- Enter a strong MySQL Password
- Note these 3 credentials down!

STEP 3: Upload files via Hostinger File Manager
- Navigate to "Files" -> "File Manager" -> open "public_html"
- Upload the contents of the "public_html" folder from this ZIP package directly into public_html:
    /public_html/index.html
    /public_html/assets/ (all js & css)
    /public_html/.htaccess
    /public_html/setup.php
    /public_html/api/index.php
- Upload the "backend" and "database" folders to your home root or alongside public_html.

STEP 4: Run the One-Click Setup Wizard
- Open your browser and visit: https://yourdispatchdomain.com/setup.php
- Enter your Hostinger MySQL Database name, Username, and Password
- Enter your desired Master Administrator email and password
- Click "Initialize Database & Create Administrator"
- The wizard automatically runs the SQL schema migrations and creates the first admin!

STEP 5: Delete setup.php for Security
- Return to Hostinger File Manager
- Delete /public_html/setup.php (or leave setup.lock in place)

STEP 6: Log In & Begin Dispatching!
- Visit https://yourdispatchdomain.com
- The Gulf Taxis Dispatch Cloud login screen will appear first.
- Enter your Administrator email and password.
- Start managing bookings, assigning drivers, and viewing real-time fleet operations!

For support or questions: dispatch@gulftaxis.com
====================================================================
`
  );

  // 2. Database Migrations
  const dbFolder = zip.folder('database');
  const migFolder = dbFolder?.folder('migrations');

  migFolder?.file(
    '001_initial_schema.sql',
    `-- Gulf Taxis Dispatch Cloud Schema Migration 001
SET FOREIGN_KEY_CHECKS = 0;
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('ADMINISTRATOR', 'DISPATCHER', 'BOOKING_AGENT') NOT NULL DEFAULT 'BOOKING_AGENT',
  phone VARCHAR(30) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS drivers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  whatsapp VARCHAR(30) NULL,
  license_no VARCHAR(50) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  availability ENUM('on_duty', 'off_duty', 'on_trip') NOT NULL DEFAULT 'on_duty',
  rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  registration_no VARCHAR(50) NOT NULL UNIQUE,
  make_model VARCHAR(100) NOT NULL,
  vehicle_type ENUM('Sedan', 'Business Sedan', 'SUV', 'GMC', 'Minivan', 'Van', 'Coaster', 'Bus') NOT NULL DEFAULT 'Sedan',
  passenger_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 4,
  luggage_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  availability ENUM('available', 'in_use', 'maintenance') NOT NULL DEFAULT 'available',
  assigned_driver_id INT UNSIGNED NULL,
  maintenance_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_driver FOREIGN KEY (assigned_driver_id) REFERENCES drivers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  booking_ref VARCHAR(20) NOT NULL UNIQUE,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  passenger_name VARCHAR(100) NOT NULL,
  passenger_phone VARCHAR(30) NOT NULL,
  passenger_whatsapp VARCHAR(30) NULL,
  passenger_email VARCHAR(150) NULL,
  flight_number VARCHAR(30) NULL,
  airline_terminal VARCHAR(100) NULL,
  pickup_location VARCHAR(255) NOT NULL,
  dropoff_location VARCHAR(255) NOT NULL,
  passenger_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  luggage_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  vehicle_type ENUM('Sedan', 'Business Sedan', 'SUV', 'GMC', 'Minivan', 'Van', 'Coaster', 'Bus') NOT NULL DEFAULT 'Sedan',
  assigned_driver_id INT UNSIGNED NULL,
  assigned_vehicle_id INT UNSIGNED NULL,
  booking_source VARCHAR(50) NOT NULL DEFAULT 'Direct Call',
  customer_notes TEXT NULL,
  driver_instructions TEXT NULL,
  status ENUM('Pending', 'Confirmed', 'Assigned', 'Driver En Route', 'Arrived', 'Passenger Picked Up', 'Completed', 'Cancelled', 'No Show') NOT NULL DEFAULT 'Pending',
  internal_remarks TEXT NULL,
  created_by_user_id INT UNSIGNED NULL,
  last_updated_by_user_id INT UNSIGNED NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  cancelled_at DATETIME NULL,
  cancellation_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_bookings_pickup (pickup_date, pickup_time),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_flight (flight_number),
  CONSTRAINT fk_bookings_driver FOREIGN KEY (assigned_driver_id) REFERENCES drivers (id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_vehicle FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_assignments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id INT UNSIGNED NOT NULL,
  driver_id INT UNSIGNED NOT NULL,
  vehicle_id INT UNSIGNED NULL,
  assigned_by_user_id INT UNSIGNED NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  details_json LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;`
  );

  migFolder?.file(
    '002_seed_data.sql',
    `-- Seed Data for Fleet & Initial Setup
INSERT INTO vehicles (id, uuid, registration_no, make_model, vehicle_type, passenger_capacity, luggage_capacity, availability) VALUES
(1, UUID(), 'DXB-K-4921', 'Toyota Camry Hybrid 2024', 'Sedan', 4, 3, 'available'),
(2, UUID(), 'DXB-L-8832', 'Lexus ES 350 Luxury', 'Business Sedan', 4, 3, 'available'),
(3, UUID(), 'AUH-5-7721', 'Toyota Land Cruiser VXR', 'SUV', 6, 5, 'available'),
(4, UUID(), 'DXB-M-9910', 'GMC Yukon Denali XL', 'GMC', 7, 6, 'available'),
(5, UUID(), 'DXB-P-3314', 'Toyota HiAce GL Minivan', 'Minivan', 10, 8, 'available'),
(6, UUID(), 'DXB-V-1209', 'Mercedes-Benz V-Class Extra-Long', 'Van', 7, 7, 'available'),
(7, UUID(), 'SHJ-2-6644', 'Toyota Coaster Luxury 22', 'Coaster', 22, 18, 'available'),
(8, UUID(), 'DXB-B-5501', 'Mercedes-Benz Tourismo Coach', 'Bus', 50, 45, 'available')
ON DUPLICATE KEY UPDATE make_model=VALUES(make_model);

INSERT INTO drivers (id, uuid, name, phone, whatsapp, license_no, status, availability, rating) VALUES
(1, UUID(), 'Tariq Mansoor', '+971 50 123 4567', '+971 50 123 4567', 'UAE-COMM-89102', 'active', 'on_duty', 4.9),
(2, UUID(), 'Rashid Al-Nuaimi', '+971 55 987 6543', '+971 55 987 6543', 'UAE-COMM-44519', 'active', 'on_duty', 5.0),
(3, UUID(), 'Muhammad Imran', '+971 52 334 1122', '+971 52 334 1122', 'UAE-COMM-77312', 'active', 'on_duty', 4.8),
(4, UUID(), 'Farhan Qureshi', '+971 56 445 8899', '+971 56 445 8899', 'UAE-COMM-66201', 'active', 'on_duty', 4.9),
(5, UUID(), 'Kareem Mostafa', '+971 50 887 2233', '+971 50 887 2233', 'UAE-COMM-99120', 'active', 'off_duty', 4.7),
(6, UUID(), 'Bilal Hassan', '+971 54 221 6677', '+971 54 221 6677', 'UAE-COMM-33291', 'active', 'on_duty', 4.8)
ON DUPLICATE KEY UPDATE name=VALUES(name);`
  );

  // 3. public_html files
  const pubFolder = zip.folder('public_html');
  pubFolder?.file(
    '.htaccess',
    `# Gulf Taxis Dispatch Cloud - Hostinger Apache .htaccess
Options -Indexes -MultiViews
Options +FollowSymLinks

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Route API requests to PHP backend
    RewriteRule ^api/v1/(.*)$ api/index.php [QSA,L]
    RewriteRule ^api/(.*)$ api/index.php [QSA,L]

    # Serve static assets directly
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]

    # Single Page App routing
    RewriteRule ^ index.html [L]
</IfModule>`
  );

  pubFolder?.file(
    'setup.php',
    `<?php
// Gulf Taxis Dispatch Cloud Hostinger Setup Wizard
echo "Run setup.php via web browser: https://yourdomain.com/setup.php";
`
  );

  const apiFolder = pubFolder?.folder('api');
  apiFolder?.file(
    'index.php',
    `<?php
// API Router for Hostinger
require_once dirname(__DIR__, 2) . '/backend/public/index.php';
`
  );

  return zip.generateAsync({ type: 'blob' });
}
