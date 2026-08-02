CREATE TABLE IF NOT EXISTS bias_review_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  status ENUM('open', 'in_review', 'approved', 'needs_revision', 'resolved') NOT NULL DEFAULT 'open',
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  trigger_source ENUM('response_signal', 'manual', 'question_edit', 'new_question') NOT NULL DEFAULT 'manual',
  trigger_summary VARCHAR(255) NOT NULL,
  assigned_to_user_id BIGINT UNSIGNED NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  resolved_by_user_id BIGINT UNSIGNED NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_bias_review_items_public_id (public_id),
  UNIQUE KEY idx_bias_review_items_question_active (question_id, status),
  KEY idx_bias_review_items_status (status),
  KEY idx_bias_review_items_severity (severity),
  KEY idx_bias_review_items_assigned_to (assigned_to_user_id),
  CONSTRAINT fk_bias_review_items_question_id
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_bias_review_items_assigned_to_user_id
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bias_review_items_created_by_user_id
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_bias_review_items_resolved_by_user_id
    FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bias_review_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  review_item_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_bias_review_comments_public_id (public_id),
  KEY idx_bias_review_comments_item_created (review_item_id, created_at),
  CONSTRAINT fk_bias_review_comments_review_item_id
    FOREIGN KEY (review_item_id) REFERENCES bias_review_items(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_bias_review_comments_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bias_review_audit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  review_item_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  old_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_bias_review_audit_events_public_id (public_id),
  KEY idx_bias_review_audit_events_item_created (review_item_id, created_at),
  CONSTRAINT fk_bias_review_audit_events_review_item_id
    FOREIGN KEY (review_item_id) REFERENCES bias_review_items(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_bias_review_audit_events_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
