-- =====================================================
-- BOAZCHAJI - FULL DATABASE SCHEMA
-- Mfumo wa Kurekodi Huduma za Kucha Simu
-- =====================================================

CREATE DATABASE IF NOT EXISTS boazchaji_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE boazchaji_db;

-- =====================================================
-- TABLE 1: USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50) DEFAULT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(10) NOT NULL UNIQUE,
    email VARCHAR(100) DEFAULT NULL UNIQUE,
    sex ENUM('Male', 'Female') NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent') NOT NULL DEFAULT 'agent',
    language VARCHAR(10) DEFAULT 'sw',
    theme VARCHAR(10) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 2: CUSTOMERS
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) DEFAULT NULL,
    created_by_agent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_created_by (created_by_agent_id),
    FOREIGN KEY (created_by_agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 3: DEVICE_TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS device_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weka aina za vifaa vya mwanzo
INSERT INTO device_types (name) VALUES 
('Phone'),
('Radio'),
('Battery'),
('Charger'),
('Laptop')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =====================================================
-- TABLE 4: SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    customer_id INT NOT NULL,
    device_type_id INT NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    amount DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * amount) STORED,
    status ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
    image_path VARCHAR(255) DEFAULT NULL,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent (agent_id),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE 5: ACTIVITY_LOGS (Admin kuona kila kitu)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_id INT DEFAULT NULL,
    details TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEFAULT ADMIN USER
-- =====================================================
-- Password ni: admin123
-- Namba: 0712345678
-- Tafadhali badilisha baada ya kuingia mara ya kwanza!
INSERT INTO users (first_name, last_name, phone, email, sex, password, role, language, theme) 
VALUES (
    'Boaz', 
    'Admin', 
    '0714343162', 
    'tzonetech8@gmail.com', 
    'Male', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'admin', 
    'sw', 
    'light'
) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- =====================================================
-- DEFAULT AGENT (Kwa majaribio)
-- =====================================================
-- Password ni: agent123
-- Namba: 0765432109
INSERT INTO users (first_name, last_name, phone, email, sex, password, role, language, theme) 
VALUES (
    'Juma', 
    'Agent', 
    '0765432109', 
    'agent@boazchaji.com', 
    'Male', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- agent123
    'agent', 
    'sw', 
    'light'
) ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- =====================================================
-- DONE!
-- =====================================================

ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'trash') DEFAULT 'active';
-- 1. Ongeza column ya 'taken' kwenye services
ALTER TABLE services ADD COLUMN taken BOOLEAN DEFAULT FALSE AFTER status;

-- 2. Tengeneza table ya notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT DEFAULT NULL,
    receiver_id INT DEFAULT NULL, -- NULL inamaanisha ni kwa wote (Broadcast)
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 1. Kuongeza column ya kufuatilia idadi iliyochukuliwa
ALTER TABLE services ADD COLUMN taken_quantity INT DEFAULT 0 AFTER taken;

-- 2. Kubadilisha aina ya column ya picha ili iweze kuhifadhi majina ya picha nyingi (JSON)
ALTER TABLE services MODIFY COLUMN image_path LONGTEXT;

-- 1. Kuongeza column ya attachment (kwa ajili ya PDF au Picha)
ALTER TABLE notifications ADD COLUMN attachment_path VARCHAR(255) DEFAULT NULL;
-- 2. Kuongeza column ya type (kutofautisha 'system' na 'message')
ALTER TABLE notifications ADD COLUMN type ENUM('system', 'message') DEFAULT 'message';

-- Kuongeza tracking ya failed attempts na lockout
ALTER TABLE users ADD COLUMN failed_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN lockout_until DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL DEFAULT NULL;
