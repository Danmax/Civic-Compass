CREATE TABLE IF NOT EXISTS assessment_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  mode ENUM('quick', 'full') NOT NULL,
  answered_count SMALLINT UNSIGNED NOT NULL,
  skipped_count SMALLINT UNSIGNED NOT NULL,
  confidence TINYINT UNSIGNED NOT NULL,
  answers_json JSON NOT NULL,
  importance_json JSON NOT NULL,
  scores_json JSON NOT NULL,
  accuracy_rating VARCHAR(64) NULL,
  user_agent_hash CHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_profiles_public_id (public_id),
  KEY idx_assessment_profiles_created_at (created_at),
  KEY idx_assessment_profiles_mode_created_at (mode, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
