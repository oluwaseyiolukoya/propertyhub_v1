-- Migration: Add invoice_attachments table for storing file attachments
-- Created: 2025-11-18
-- Purpose: Enable developers to attach files (receipts, invoices, documents) to project invoices
--          with proper quota tracking and customer isolation

-- ============================================================================
-- 1. Create invoice_attachments table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  invoice_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,

  CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES project_invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. Add indexes for performance
-- ============================================================================

CREATE INDEX idx_invoice_attachments_invoice ON invoice_attachments(invoice_id);
CREATE INDEX idx_invoice_attachments_customer ON invoice_attachments(customer_id);
CREATE INDEX idx_invoice_attachments_uploaded_at ON invoice_attachments(uploaded_at);
CREATE INDEX idx_invoice_attachments_file_type ON invoice_attachments(file_type);

-- ============================================================================
-- 3. Add check constraints for data integrity
-- ============================================================================

-- Ensure file size is positive and within limits (max 50MB per file)
ALTER TABLE invoice_attachments
ADD CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 52428800);

-- Ensure file_type is one of the allowed types
ALTER TABLE invoice_attachments
ADD CONSTRAINT chk_file_type CHECK (file_type IN ('image', 'pdf', 'document', 'spreadsheet', 'other'));

-- ============================================================================
-- 4. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE invoice_attachments IS 'Stores file attachments for project invoices with metadata and quota tracking';
COMMENT ON COLUMN invoice_attachments.id IS 'Unique identifier for the attachment';
COMMENT ON COLUMN invoice_attachments.invoice_id IS 'Foreign key to project_invoices table';
COMMENT ON COLUMN invoice_attachments.customer_id IS 'Foreign key to customers table for quota tracking';
COMMENT ON COLUMN invoice_attachments.file_path IS 'Path in Digital Ocean Spaces (e.g., customers/{customerId}/invoices/{invoiceId}/{filename})';
COMMENT ON COLUMN invoice_attachments.file_name IS 'Original filename uploaded by user';
COMMENT ON COLUMN invoice_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN invoice_attachments.file_type IS 'Categorized file type (image, pdf, document, spreadsheet, other)';
COMMENT ON COLUMN invoice_attachments.mime_type IS 'MIME type of the file (e.g., application/pdf, image/png)';
COMMENT ON COLUMN invoice_attachments.uploaded_by IS 'Foreign key to users table - who uploaded the file';
COMMENT ON COLUMN invoice_attachments.uploaded_at IS 'Timestamp when file was uploaded';
COMMENT ON COLUMN invoice_attachments.metadata IS 'Additional metadata like description, upload context, etc.';

-- ============================================================================
-- 5. Create helper function to get invoice attachment stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_invoice_attachment_stats(p_invoice_id TEXT)
RETURNS TABLE (
  total_attachments BIGINT,
  total_size BIGINT,
  total_size_formatted TEXT,
  file_types JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_attachments,
    COALESCE(SUM(file_size), 0)::BIGINT as total_size,
    CASE
      WHEN COALESCE(SUM(file_size), 0) = 0 THEN '0 Bytes'
      WHEN COALESCE(SUM(file_size), 0) < 1024 THEN COALESCE(SUM(file_size), 0)::TEXT || ' Bytes'
      WHEN COALESCE(SUM(file_size), 0) < 1048576 THEN ROUND(COALESCE(SUM(file_size), 0)::NUMERIC / 1024, 2)::TEXT || ' KB'
      WHEN COALESCE(SUM(file_size), 0) < 1073741824 THEN ROUND(COALESCE(SUM(file_size), 0)::NUMERIC / 1048576, 2)::TEXT || ' MB'
      ELSE ROUND(COALESCE(SUM(file_size), 0)::NUMERIC / 1073741824, 2)::TEXT || ' GB'
    END as total_size_formatted,
    jsonb_object_agg(
      file_type,
      jsonb_build_object(
        'count', type_count,
        'size', type_size
      )
    ) as file_types
  FROM (
    SELECT
      file_type,
      COUNT(*)::BIGINT as type_count,
      SUM(file_size)::BIGINT as type_size
    FROM invoice_attachments
    WHERE invoice_id = p_invoice_id
    GROUP BY file_type
  ) type_stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_invoice_attachment_stats(TEXT) IS 'Returns statistics about attachments for a specific invoice';

-- ============================================================================
-- 6. Create trigger to update storage_transactions on attachment operations
-- ============================================================================

-- This trigger automatically logs attachment uploads to storage_transactions
CREATE OR REPLACE FUNCTION log_invoice_attachment_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the upload to storage_transactions
  INSERT INTO storage_transactions (
    id,
    customer_id,
    transaction_type,
    file_path,
    file_size,
    category,
    subcategory,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    gen_random_uuid(),
    NEW.customer_id,
    'upload',
    NEW.file_path,
    NEW.file_size,
    'invoices',
    'attachments',
    NEW.invoice_id::TEXT,
    NEW.uploaded_by,
    jsonb_build_object(
      'file_name', NEW.file_name,
      'file_type', NEW.file_type,
      'mime_type', NEW.mime_type,
      'invoice_id', NEW.invoice_id,
      'source', 'invoice_attachment'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_invoice_attachment_upload
AFTER INSERT ON invoice_attachments
FOR EACH ROW
EXECUTE FUNCTION log_invoice_attachment_upload();

COMMENT ON TRIGGER trigger_log_invoice_attachment_upload ON invoice_attachments IS 'Automatically logs invoice attachment uploads to storage_transactions';

-- ============================================================================
-- 7. Create trigger to log attachment deletions
-- ============================================================================

CREATE OR REPLACE FUNCTION log_invoice_attachment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion to storage_transactions
  INSERT INTO storage_transactions (
    id,
    customer_id,
    transaction_type,
    file_path,
    file_size,
    category,
    subcategory,
    entity_id,
    performed_by,
    metadata
  ) VALUES (
    gen_random_uuid(),
    OLD.customer_id,
    'delete',
    OLD.file_path,
    OLD.file_size,
    'invoices',
    'attachments',
    OLD.invoice_id::TEXT,
    current_setting('app.current_user_id', true)::TEXT,
    jsonb_build_object(
      'file_name', OLD.file_name,
      'file_type', OLD.file_type,
      'mime_type', OLD.mime_type,
      'invoice_id', OLD.invoice_id,
      'source', 'invoice_attachment',
      'deleted_at', NOW()
    )
  );

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_invoice_attachment_deletion
BEFORE DELETE ON invoice_attachments
FOR EACH ROW
EXECUTE FUNCTION log_invoice_attachment_deletion();

COMMENT ON TRIGGER trigger_log_invoice_attachment_deletion ON invoice_attachments IS 'Automatically logs invoice attachment deletions to storage_transactions';

-- ============================================================================
-- 8. Grant permissions (adjust based on your database users)
-- ============================================================================

-- Grant appropriate permissions to your application user
-- Uncomment and adjust the username as needed:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_attachments TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- 9. Verification queries
-- ============================================================================

-- Run these queries to verify the migration was successful:

-- Check table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name = 'invoice_attachments'
-- );

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'invoice_attachments';

-- Check constraints
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'invoice_attachments'::regclass;

-- Check triggers
-- SELECT tgname, tgtype, tgenabled
-- FROM pg_trigger
-- WHERE tgrelid = 'invoice_attachments'::regclass;

-- ============================================================================
-- Migration complete!
-- ============================================================================

-- Next steps:
-- 1. Update Prisma schema to include invoice_attachments model
-- 2. Run: npx prisma db pull (to sync schema from database)
-- 3. Run: npx prisma generate (to regenerate Prisma client)
-- 4. Implement backend API endpoints for attachment operations
-- 5. Update frontend to support file uploads

