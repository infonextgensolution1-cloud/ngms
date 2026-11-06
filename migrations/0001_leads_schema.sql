-- migrations/0001_leads_schema.sql
-- NGMS quote/enquiry intake schema for Cloudflare D1.
-- Apply with: npx wrangler d1 migrations apply <DATABASE_NAME> --remote

CREATE TABLE IF NOT EXISTS quote_requests (
    id TEXT PRIMARY KEY,                       -- e.g. 'lead_20261103_001' or nanoid
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    service_type TEXT NOT NULL,                -- 'solar_cleaning', 'waterproofing', etc.
    suburb TEXT NOT NULL,                      -- 'Strand', 'Gordon''s Bay', 'Somerset West', etc.
    job_details TEXT NOT NULL,
    status TEXT DEFAULT 'new',                 -- 'new', 'quoted', 'in_progress', 'completed'
    estimated_val REAL DEFAULT 0.0,
    quote_ref TEXT                             -- Links to your Excel workbook quote ID
);

CREATE TABLE IF NOT EXISTS quote_attachments (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
    r2_key TEXT NOT NULL,                      -- e.g. 'quotes/lead_123/site_photo_1.jpg'
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at
    ON quote_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_quotes_status
    ON quote_requests(status);
