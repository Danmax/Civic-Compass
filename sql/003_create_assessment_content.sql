CREATE TABLE IF NOT EXISTS assessment_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version_key VARCHAR(64) NOT NULL,
  title VARCHAR(140) NOT NULL,
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_versions_version_key (version_key),
  KEY idx_assessment_versions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_dimensions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dimension_key VARCHAR(64) NOT NULL,
  name VARCHAR(140) NOT NULL,
  low_label VARCHAR(140) NOT NULL,
  high_label VARCHAR(140) NOT NULL,
  explanation TEXT NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_dimensions_key (dimension_key),
  KEY idx_assessment_dimensions_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_key VARCHAR(64) NOT NULL,
  name VARCHAR(140) NOT NULL,
  short_label VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  history TEXT NOT NULL,
  viewpoints TEXT NOT NULL,
  debate TEXT NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_categories_key (category_key),
  KEY idx_assessment_categories_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_category_readings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(500) NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_category_readings_unique (category_id, title),
  CONSTRAINT fk_assessment_category_readings_category_id
    FOREIGN KEY (category_id) REFERENCES assessment_categories(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_answer_choices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  label VARCHAR(140) NOT NULL,
  short_label VARCHAR(80) NOT NULL,
  answer_value TINYINT NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_answer_choices_value (answer_value),
  KEY idx_assessment_answer_choices_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_importance_choices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  label VARCHAR(140) NOT NULL,
  multiplier DECIMAL(4,2) NOT NULL,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_importance_choices_multiplier (multiplier),
  KEY idx_assessment_importance_choices_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version_id BIGINT UNSIGNED NOT NULL,
  question_number SMALLINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  statement TEXT NOT NULL,
  context TEXT NOT NULL,
  value_label VARCHAR(140) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_questions_version_number (version_id, question_number),
  KEY idx_assessment_questions_category (category_id),
  KEY idx_assessment_questions_order (version_id, display_order),
  CONSTRAINT fk_assessment_questions_version_id
    FOREIGN KEY (version_id) REFERENCES assessment_versions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assessment_questions_category_id
    FOREIGN KEY (category_id) REFERENCES assessment_categories(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_question_weights (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id BIGINT UNSIGNED NOT NULL,
  dimension_id BIGINT UNSIGNED NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_question_weights_unique (question_id, dimension_id),
  CONSTRAINT fk_assessment_question_weights_question_id
    FOREIGN KEY (question_id) REFERENCES assessment_questions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_assessment_question_weights_dimension_id
    FOREIGN KEY (dimension_id) REFERENCES assessment_dimensions(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assessment_profile_responses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  assessment_profile_id BIGINT UNSIGNED NOT NULL,
  question_number SMALLINT UNSIGNED NOT NULL,
  answer_value TINYINT NULL,
  importance_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_assessment_profile_responses_unique (assessment_profile_id, question_number),
  KEY idx_assessment_profile_responses_question (question_number),
  CONSTRAINT fk_assessment_profile_responses_profile_id
    FOREIGN KEY (assessment_profile_id) REFERENCES assessment_profiles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_assessment_profile_responses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_assessment_profile_id BIGINT UNSIGNED NOT NULL,
  question_number SMALLINT UNSIGNED NOT NULL,
  answer_value TINYINT NULL,
  importance_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_user_assessment_profile_responses_unique (user_assessment_profile_id, question_number),
  KEY idx_user_assessment_profile_responses_question (question_number),
  CONSTRAINT fk_user_assessment_profile_responses_profile_id
    FOREIGN KEY (user_assessment_profile_id) REFERENCES user_assessment_profiles(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
