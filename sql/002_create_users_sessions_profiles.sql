CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'researcher', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_users_public_id (public_id),
  UNIQUE KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_user_sessions_token_hash (token_hash),
  KEY idx_user_sessions_user_id (user_id),
  KEY idx_user_sessions_expires_at (expires_at),
  CONSTRAINT fk_user_sessions_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_assessment_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(140) NOT NULL,
  mode ENUM('quick', 'full') NOT NULL,
  answered_count SMALLINT UNSIGNED NOT NULL,
  skipped_count SMALLINT UNSIGNED NOT NULL,
  confidence TINYINT UNSIGNED NOT NULL,
  answers_json JSON NOT NULL,
  importance_json JSON NOT NULL,
  scores_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_user_assessment_profiles_public_id (public_id),
  KEY idx_user_assessment_profiles_user_created (user_id, created_at),
  CONSTRAINT fk_user_assessment_profiles_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
