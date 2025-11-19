-- Migration: Add Customer Storage Tracking
-- Description: Adds storage quota management and tracking for multi-tenant storage
-- Date: 2025-11-18

-- ============================================================================
-- 1. Add storage columns to customers table
-- ============================================================================
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 5368709120,
ADD COLUMN IF NOT EXISTS storage_last_calculated TIMESTAMP DEFAULT NOW();

COMMENT ON COLUMN customers.storage_used IS 'Total storage used by customer in bytes';
COMMENT ON COLUMN customers.storage_limit IS 'Storage limit for customer in bytes (default 5GB)';
COMMENT ON COLUMN customers.storage_last_calculated IS 'Last time storage usage was calculated';

-- ============================================================================
-- 2. Add storage limit to plans table
-- ============================================================================
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 5368709120;

COMMENT ON COLUMN plans.storage_limit IS 'Storage limit included in this plan (in bytes)';

-- Update existing plans with storage limits
UPDATE plans SET storage_limit = 5368709120 WHERE name = 'Starter';           -- 5GB
UPDATE plans SET storage_limit = 53687091200 WHERE name = 'Professional';     -- 50GB
UPDATE plans SET storage_limit = 107374182400 WHERE name = 'Business';        -- 100GB
UPDATE plans SET storage_limit = 9223372036854775807 WHERE name = 'Enterprise'; -- Unlimited (max BIGINT)

-- ============================================================================
-- 3. Create storage_usage table (breakdown by file type and category)
-- ============================================================================
CREATE TABLE IF NOT EXISTS storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  file_count INTEGER DEFAULT 0,
  total_size BIGINT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, file_type, category)
);

CREATE INDEX IF NOT EXISTS idx_storage_usage_customer ON storage_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_storage_usage_file_type ON storage_usage(file_type);

COMMENT ON TABLE storage_usage IS 'Tracks storage usage breakdown by file type and category per customer';
COMMENT ON COLUMN storage_usage.file_type IS 'Type of file: image, video, document, audio, other';
COMMENT ON COLUMN storage_usage.category IS 'Category: documents, properties, tenants, projects, etc.';
COMMENT ON COLUMN storage_usage.file_count IS 'Number of files in this category';
COMMENT ON COLUMN storage_usage.total_size IS 'Total size of files in this category (bytes)';

-- ============================================================================
-- 4. Create storage_transactions table (complete audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS storage_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_id UUID,
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50),
  action VARCHAR(20) NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_storage_transactions_customer ON storage_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_storage_transactions_created ON storage_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_transactions_action ON storage_transactions(action);
CREATE INDEX IF NOT EXISTS idx_storage_transactions_file_path ON storage_transactions(file_path);

COMMENT ON TABLE storage_transactions IS 'Complete audit trail of all file upload/delete operations';
COMMENT ON COLUMN storage_transactions.action IS 'Action performed: upload, delete, replace';
COMMENT ON COLUMN storage_transactions.metadata IS 'Additional metadata about the file operation';

-- ============================================================================
-- 5. Create function to automatically update customer storage on plan change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_customer_storage_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- When a customer's plan changes, update their storage limit
  -- Note: Prisma uses camelCase "planId" for the column name
  IF NEW."planId" IS NOT NULL AND (OLD."planId" IS NULL OR NEW."planId" != OLD."planId") THEN
    UPDATE customers c
    SET storage_limit = p.storage_limit
    FROM plans p
    WHERE c.id = NEW.id AND p.id = NEW."planId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_storage_limit ON customers;
CREATE TRIGGER trigger_update_storage_limit
  AFTER UPDATE OF "planId" ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_storage_limit();

-- ============================================================================
-- 6. Create helper function to get storage stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_customer_storage_stats(p_customer_id UUID)
RETURNS TABLE (
  used_bytes BIGINT,
  limit_bytes BIGINT,
  available_bytes BIGINT,
  percentage NUMERIC,
  file_count INTEGER,
  last_calculated TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(c.storage_used, 0) as used_bytes,
    COALESCE(c.storage_limit, 5368709120) as limit_bytes,
    COALESCE(c.storage_limit, 5368709120) - COALESCE(c.storage_used, 0) as available_bytes,
    CASE
      WHEN COALESCE(c.storage_limit, 5368709120) > 0
      THEN (COALESCE(c.storage_used, 0)::NUMERIC / COALESCE(c.storage_limit, 5368709120)::NUMERIC * 100)
      ELSE 0
    END as percentage,
    COALESCE(SUM(su.file_count)::INTEGER, 0) as file_count,
    c.storage_last_calculated
  FROM customers c
  LEFT JOIN storage_usage su ON su.customer_id = c.id
  WHERE c.id = p_customer_id
  GROUP BY c.id, c.storage_used, c.storage_limit, c.storage_last_calculated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_storage_used ON customers(storage_used);
CREATE INDEX IF NOT EXISTS idx_customers_storage_limit ON customers(storage_limit);
CREATE INDEX IF NOT EXISTS idx_plans_storage_limit ON plans(storage_limit);

-- ============================================================================
-- 8. Add check constraints for data integrity
-- ============================================================================
ALTER TABLE customers
ADD CONSTRAINT chk_storage_used_positive
CHECK (storage_used >= 0);

ALTER TABLE customers
ADD CONSTRAINT chk_storage_limit_positive
CHECK (storage_limit > 0);

ALTER TABLE storage_usage
ADD CONSTRAINT chk_file_count_positive
CHECK (file_count >= 0);

ALTER TABLE storage_usage
ADD CONSTRAINT chk_total_size_positive
CHECK (total_size >= 0);

ALTER TABLE storage_transactions
ADD CONSTRAINT chk_file_size_positive
CHECK (file_size >= 0);

ALTER TABLE storage_transactions
ADD CONSTRAINT chk_action_valid
CHECK (action IN ('upload', 'delete', 'replace'));

-- ============================================================================
-- 9. Grant necessary permissions (adjust based on your user setup)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON storage_usage TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON storage_transactions TO your_app_user;
-- GRANT SELECT, UPDATE ON customers TO your_app_user;
-- GRANT USAGE ON SEQUENCE storage_usage_id_seq TO your_app_user;
-- GRANT USAGE ON SEQUENCE storage_transactions_id_seq TO your_app_user;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
-- ✅ Added storage tracking columns to customers table
-- ✅ Added storage limits to plans table
-- ✅ Created storage_usage table for breakdown tracking
-- ✅ Created storage_transactions table for audit trail
-- ✅ Created trigger to auto-update storage limits on plan change
-- ✅ Created helper function for storage stats
-- ✅ Added indexes for performance
-- ✅ Added constraints for data integrity
-- ============================================================================

