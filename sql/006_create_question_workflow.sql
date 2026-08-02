ALTER TABLE assessment_questions
  ADD COLUMN workflow_status ENUM('draft', 'in_review', 'approved', 'published', 'archived', 'rejected') NOT NULL DEFAULT 'published' AFTER is_active,
  ADD COLUMN created_by_user_id BIGINT UNSIGNED NULL AFTER display_order,
  ADD COLUMN updated_by_user_id BIGINT UNSIGNED NULL AFTER created_by_user_id,
  ADD KEY idx_assessment_questions_workflow_status (workflow_status),
  ADD CONSTRAINT fk_assessment_questions_created_by_user_id
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL,
  ADD CONSTRAINT fk_assessment_questions_updated_by_user_id
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
    ON DELETE SET NULL;

UPDATE assessment_questions
SET workflow_status = 'published'
WHERE workflow_status IS NULL OR workflow_status = 'draft';

CREATE TABLE IF NOT EXISTS question_review_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_question_review_comments_public_id (public_id),
  KEY idx_question_review_comments_question_created (question_id, created_at),
  CONSTRAINT fk_question_review_comments_question_id
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_question_review_comments_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_audit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  old_status VARCHAR(40) NULL,
  new_status VARCHAR(40) NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_question_audit_events_public_id (public_id),
  KEY idx_question_audit_events_question_created (question_id, created_at),
  CONSTRAINT fk_question_audit_events_question_id
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_question_audit_events_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_health_snapshots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  response_count INT UNSIGNED NOT NULL DEFAULT 0,
  skipped_count INT UNSIGNED NOT NULL DEFAULT 0,
  skip_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_strength DECIMAL(5,2) NULL,
  polarization_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_question_health_snapshots_public_id (public_id),
  KEY idx_question_health_snapshots_question_calculated (question_id, calculated_at),
  CONSTRAINT fk_question_health_snapshots_question_id
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
