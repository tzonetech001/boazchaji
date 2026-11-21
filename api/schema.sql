CREATE DATABASE IF NOT EXISTS boazchaji
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE boazchaji;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(80) NOT NULL,
  second_name VARCHAR(80) NULL,
  last_name VARCHAR(80) NOT NULL,
  phone CHAR(10) NOT NULL,
  email VARCHAR(190) NULL,
  sex ENUM('male', 'female', 'other') NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'agent') NOT NULL DEFAULT 'agent',
  is_super_admin TINYINT(1) NOT NULL DEFAULT 0,
  profile_image_path VARCHAR(500) NULL,
  auth_version INT UNSIGNED NOT NULL DEFAULT 0,
  language ENUM('sw', 'en') NOT NULL DEFAULT 'sw',
  theme ENUM('light', 'dark') NOT NULL DEFAULT 'light',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_phone (phone),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT chk_users_phone CHECK (phone REGEXP '^(07|06)[0-9]{8}$')
) ENGINE=InnoDB;

CREATE TABLE customers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  phone CHAR(10) NULL,
  created_by_agent_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_customers_name (name),
  KEY ix_customers_phone (phone),
  KEY ix_customers_agent (created_by_agent_id),
  CONSTRAINT fk_customers_agent FOREIGN KEY (created_by_agent_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_customers_phone CHECK (phone IS NULL OR phone REGEXP '^(07|06)[0-9]{8}$')
) ENGINE=InnoDB;

CREATE TABLE device_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_type_name (name),
  CONSTRAINT fk_device_types_user FOREIGN KEY (created_by_user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  agent_id BIGINT UNSIGNED NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  device_type_id BIGINT UNSIGNED NOT NULL,
  device_name VARCHAR(160) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  amount DECIMAL(12,2) NOT NULL DEFAULT 300.00,
  status ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  image_path VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_services_agent_status_date (agent_id, status, created_at),
  KEY ix_services_customer (customer_id),
  KEY ix_services_device_type (device_type_id),
  CONSTRAINT fk_services_agent FOREIGN KEY (agent_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_services_customer FOREIGN KEY (customer_id)
    REFERENCES customers (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_services_device_type FOREIGN KEY (device_type_id)
    REFERENCES device_types (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_services_quantity CHECK (quantity >= 1),
  CONSTRAINT chk_services_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  action_taken VARCHAR(120) NOT NULL,
  target_record_id BIGINT UNSIGNED NULL,
  details JSON NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_activity_user_time (user_id, timestamp),
  KEY ix_activity_target (target_record_id),
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_hash (token_hash),
  KEY ix_password_reset_user_time (user_id, created_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO device_types (name) VALUES ('Phone'), ('Radio'), ('Battery')
  ON DUPLICATE KEY UPDATE name = VALUES(name);
