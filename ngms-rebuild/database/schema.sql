-- NGMS HostAfrica / MySQL schema. Run only against the dedicated nextgen staging database.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(80) NOT NULL PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','admin','manager','staff') NOT NULL DEFAULT 'staff',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_staff_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_sessions (
  id CHAR(48) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  user_agent VARCHAR(255) NOT NULL DEFAULT '',
  ip_hash CHAR(64) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_staff_sessions_user (user_id,expires_at),
  CONSTRAINT fk_staff_sessions_user FOREIGN KEY (user_id) REFERENCES staff_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS setup_state (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  completed_at DATETIME NULL,
  completed_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO setup_state (id,completed_at,completed_by) VALUES (1,NULL,NULL);

CREATE TABLE IF NOT EXISTS customers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  display_name VARCHAR(180) NOT NULL,
  customer_type VARCHAR(40) NOT NULL DEFAULT 'Individual',
  primary_phone VARCHAR(40) NOT NULL DEFAULT '',
  primary_email VARCHAR(254) NOT NULL DEFAULT '',
  service_address VARCHAR(500) NOT NULL DEFAULT '',
  billing_address VARCHAR(500) NOT NULL DEFAULT '',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_customers_name (display_name),
  KEY idx_customers_email (primary_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enquiries (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reference VARCHAR(40) NOT NULL,
  customer_id CHAR(36) NULL,
  customer_name VARCHAR(180) NOT NULL,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  service VARCHAR(180) NOT NULL,
  area VARCHAR(180) NOT NULL DEFAULT '',
  details TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'New',
  submission_key VARCHAR(80) NULL,
  preferred_date DATE NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'website',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enquiry_reference (reference),
  UNIQUE KEY uq_enquiry_submission (submission_key),
  KEY idx_enquiries_status_created (status,created_at),
  KEY idx_enquiries_customer (customer_id),
  CONSTRAINT fk_enquiries_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reference VARCHAR(40) NOT NULL,
  customer_id CHAR(36) NULL,
  source_document_id CHAR(36) NULL,
  customer_name VARCHAR(180) NOT NULL,
  service VARCHAR(180) NOT NULL,
  area VARCHAR(180) NOT NULL DEFAULT '',
  details TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'New',
  scheduled_start DATETIME NULL,
  scheduled_end DATETIME NULL,
  assigned_to VARCHAR(180) NOT NULL DEFAULT '',
  labour_cost_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  material_cost_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_reference (reference),
  KEY idx_jobs_status_schedule (status,scheduled_start),
  KEY idx_jobs_customer (customer_id),
  CONSTRAINT fk_jobs_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reference VARCHAR(40) NOT NULL,
  customer_id CHAR(36) NULL,
  customer_name VARCHAR(180) NOT NULL,
  kind ENUM('Quotation','Invoice') NOT NULL,
  amount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  subtotal_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  discount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  vat_enabled TINYINT(1) NOT NULL DEFAULT 0,
  vat_rate_basis_points INT UNSIGNED NOT NULL DEFAULT 1500,
  vat_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'Draft',
  issue_date DATE NOT NULL,
  due_date DATE NULL,
  notes TEXT NULL,
  source_document_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_document_reference (reference),
  KEY idx_documents_kind_status (kind,status,created_at),
  KEY idx_documents_customer (customer_id),
  KEY idx_documents_source (source_document_id),
  CONSTRAINT fk_documents_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_documents_source FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_lines (
  id CHAR(36) NOT NULL PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  unit VARCHAR(40) NOT NULL DEFAULT 'item',
  unit_price_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  line_total_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  KEY idx_document_lines_document (document_id,sort_order),
  CONSTRAINT fk_document_lines_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_payments (
  id CHAR(36) NOT NULL PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  amount_cents BIGINT UNSIGNED NOT NULL,
  method VARCHAR(30) NOT NULL,
  paid_at DATETIME NOT NULL,
  reference VARCHAR(160) NOT NULL DEFAULT '',
  notes TEXT NULL,
  recorded_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_invoice_payments_document (document_id,paid_at),
  CONSTRAINT fk_invoice_payments_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_payments_user FOREIGN KEY (recorded_by) REFERENCES staff_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedules (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  customer_id CHAR(36) NULL,
  customer_name VARCHAR(180) NOT NULL DEFAULT '',
  service VARCHAR(180) NOT NULL DEFAULT '',
  area VARCHAR(180) NOT NULL DEFAULT '',
  assigned_to VARCHAR(180) NOT NULL DEFAULT '',
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME NOT NULL,
  notes TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Scheduled',
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_schedules_start (scheduled_start,status),
  CONSTRAINT fk_schedules_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_schedules_user FOREIGN KEY (created_by) REFERENCES staff_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  object_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(240) NOT NULL,
  content_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Uncategorised',
  alt_text VARCHAR(500) NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  uploaded_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_media_object (object_name),
  KEY idx_media_category (category,created_at),
  KEY idx_media_published (is_published,category),
  CONSTRAINT fk_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES staff_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  service VARCHAR(180) NOT NULL,
  location VARCHAR(180) NOT NULL DEFAULT '',
  description TEXT NULL,
  completed_at DATE NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Draft',
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_projects_status_date (status,completed_at),
  CONSTRAINT fk_projects_user FOREIGN KEY (created_by) REFERENCES staff_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_photos (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  media_id CHAR(36) NOT NULL,
  stage ENUM('before','after','general') NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_project_photos_project (project_id,stage,sort_order),
  CONSTRAINT fk_project_photos_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_photos_media FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_content (
  content_key VARCHAR(100) NOT NULL PRIMARY KEY,
  content_json LONGTEXT NOT NULL,
  updated_by CHAR(36) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_site_content_user FOREIGN KEY (updated_by) REFERENCES staff_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publication_requests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  module_key VARCHAR(80) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  requested_by CHAR(36) NOT NULL,
  reviewed_by CHAR(36) NULL,
  review_note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  KEY idx_publication_requests_status (status,created_at),
  CONSTRAINT fk_publication_requester FOREIGN KEY (requested_by) REFERENCES staff_users(id),
  CONSTRAINT fk_publication_reviewer FOREIGN KEY (reviewed_by) REFERENCES staff_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publication_versions (
  id CHAR(36) NOT NULL PRIMARY KEY,
  module_key VARCHAR(80) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  content_json LONGTEXT NOT NULL,
  content_hash CHAR(64) NOT NULL,
  published_by CHAR(36) NOT NULL,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_publication_module (module_key,published_at),
  CONSTRAINT fk_publication_user FOREIGN KEY (published_by) REFERENCES staff_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publication_audit (
  id CHAR(36) NOT NULL PRIMARY KEY,
  module_key VARCHAR(80) NOT NULL,
  request_id CHAR(36) NULL,
  publication_id CHAR(36) NULL,
  action VARCHAR(40) NOT NULL,
  actor CHAR(36) NOT NULL,
  details_json LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_publication_audit_module (module_key,created_at),
  CONSTRAINT fk_publication_audit_user FOREIGN KEY (actor) REFERENCES staff_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quote_public_links (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  enquiry_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  decision VARCHAR(20) NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  job_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_quote_link_document (document_id),
  CONSTRAINT fk_quote_link_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_link_enquiry FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_link_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_quote_link_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NOT NULL,
  details_json LONGTEXT NOT NULL,
  ip_hash CHAR(64) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_entity (entity_type,entity_id,created_at),
  KEY idx_audit_created (created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES staff_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS public_intake_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip_hash CHAR(64) NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_public_intake_rate (ip_hash,attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\nCREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email_hash CHAR(64) NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_login_attempts (email_hash,ip_hash,attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_hostafrica_core');
