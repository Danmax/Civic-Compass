ALTER TABLE assessment_versions ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_versions SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_versions MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_versions ADD UNIQUE KEY idx_assessment_versions_public_id (public_id);

ALTER TABLE assessment_dimensions ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_dimensions SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_dimensions MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_dimensions ADD UNIQUE KEY idx_assessment_dimensions_public_id (public_id);

ALTER TABLE assessment_categories ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_categories SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_categories MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_categories ADD UNIQUE KEY idx_assessment_categories_public_id (public_id);

ALTER TABLE assessment_category_readings ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_category_readings SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_category_readings MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_category_readings ADD UNIQUE KEY idx_assessment_category_readings_public_id (public_id);

ALTER TABLE assessment_answer_choices ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_answer_choices SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_answer_choices MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_answer_choices ADD UNIQUE KEY idx_assessment_answer_choices_public_id (public_id);

ALTER TABLE assessment_importance_choices ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_importance_choices SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_importance_choices MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_importance_choices ADD UNIQUE KEY idx_assessment_importance_choices_public_id (public_id);

ALTER TABLE assessment_questions ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_questions SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_questions MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_questions ADD UNIQUE KEY idx_assessment_questions_public_id (public_id);

ALTER TABLE assessment_question_weights ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_question_weights SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_question_weights MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_question_weights ADD UNIQUE KEY idx_assessment_question_weights_public_id (public_id);

ALTER TABLE assessment_profile_responses ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE assessment_profile_responses SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE assessment_profile_responses MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE assessment_profile_responses ADD UNIQUE KEY idx_assessment_profile_responses_public_id (public_id);

ALTER TABLE user_assessment_profile_responses ADD COLUMN public_id CHAR(36) NULL AFTER id;
UPDATE user_assessment_profile_responses SET public_id = UUID() WHERE public_id IS NULL;
ALTER TABLE user_assessment_profile_responses MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE user_assessment_profile_responses ADD UNIQUE KEY idx_user_assessment_profile_responses_public_id (public_id);
