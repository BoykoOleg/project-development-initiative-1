ALTER TABLE photo_buffer ADD COLUMN IF NOT EXISTS attachment_json TEXT;
ALTER TABLE photo_buffer ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'telegram';