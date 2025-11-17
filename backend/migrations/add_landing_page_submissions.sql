-- Migration: Add Landing Page Submissions System
-- Description: Tables for managing all landing page form submissions (Contact, Demo, Blog, Community, etc.)
-- Created: 2025-01-17

-- Main submissions table
CREATE TABLE IF NOT EXISTS landing_page_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Submission Type
    form_type VARCHAR(50) NOT NULL, -- 'contact_us', 'schedule_demo', 'blog_inquiry', 'community_request', 'partnership', 'support'

    -- Contact Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    job_title VARCHAR(255),

    -- Submission Details
    subject VARCHAR(500),
    message TEXT NOT NULL,
    preferred_date TIMESTAMP,
    preferred_time VARCHAR(50),
    timezone VARCHAR(100),

    -- Metadata
    status VARCHAR(50) DEFAULT 'new' NOT NULL, -- 'new', 'contacted', 'in_progress', 'resolved', 'closed', 'spam'
    priority VARCHAR(20) DEFAULT 'normal' NOT NULL, -- 'low', 'normal', 'high', 'urgent'
    source VARCHAR(100), -- 'landing_page', 'blog', 'pricing_page', etc.
    referral_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- Admin Management
    assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    internal_tags TEXT[], -- Array of tags for categorization

    -- Response Tracking
    response_status VARCHAR(50), -- 'pending', 'replied', 'scheduled', 'completed'
    response_date TIMESTAMP,
    response_by UUID REFERENCES users(id) ON DELETE SET NULL,
    response_notes TEXT,

    -- Technical Details
    ip_address VARCHAR(45),
    user_agent TEXT,
    browser_info JSONB,
    device_info JSONB,

    -- Custom Fields (flexible for form-specific data)
    custom_fields JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    contacted_at TIMESTAMP,
    resolved_at TIMESTAMP,

    -- Soft delete
    deleted_at TIMESTAMP
);

-- Response tracking table
CREATE TABLE IF NOT EXISTS submission_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES landing_page_submissions(id) ON DELETE CASCADE,

    -- Response Details
    response_type VARCHAR(50) NOT NULL, -- 'email', 'phone', 'meeting', 'internal_note'
    content TEXT NOT NULL,

    -- Metadata
    responded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Attachments
    attachments JSONB, -- Array of file URLs/metadata

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_landing_submissions_form_type ON landing_page_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_landing_submissions_status ON landing_page_submissions(status);
CREATE INDEX IF NOT EXISTS idx_landing_submissions_priority ON landing_page_submissions(priority);
CREATE INDEX IF NOT EXISTS idx_landing_submissions_email ON landing_page_submissions(email);
CREATE INDEX IF NOT EXISTS idx_landing_submissions_created_at ON landing_page_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_submissions_assigned_to ON landing_page_submissions(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_landing_submissions_response_status ON landing_page_submissions(response_status);
CREATE INDEX IF NOT EXISTS idx_landing_submissions_deleted_at ON landing_page_submissions(deleted_at); -- For soft delete queries

CREATE INDEX IF NOT EXISTS idx_submission_responses_submission_id ON submission_responses(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_responses_responded_by ON submission_responses(responded_by_id);
CREATE INDEX IF NOT EXISTS idx_submission_responses_created_at ON submission_responses(created_at DESC);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_landing_submissions_updated_at
    BEFORE UPDATE ON landing_page_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_landing_submissions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE landing_page_submissions IS 'Stores all landing page form submissions from various sources';
COMMENT ON TABLE submission_responses IS 'Tracks admin responses to form submissions';

COMMENT ON COLUMN landing_page_submissions.form_type IS 'Type of form submitted: contact_us, schedule_demo, blog_inquiry, community_request, partnership, support';
COMMENT ON COLUMN landing_page_submissions.status IS 'Submission status: new, contacted, in_progress, resolved, closed, spam';
COMMENT ON COLUMN landing_page_submissions.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN landing_page_submissions.custom_fields IS 'Flexible JSON field for form-specific data';
COMMENT ON COLUMN landing_page_submissions.internal_tags IS 'Array of tags for internal categorization and filtering';

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO landing_page_submissions (
--     form_type, name, email, phone, company, subject, message, status, priority, source
-- ) VALUES
-- ('contact_us', 'John Doe', 'john@example.com', '+1234567890', 'Acme Corp', 'Product Inquiry', 'I would like to know more about your pricing plans.', 'new', 'normal', 'landing_page'),
-- ('schedule_demo', 'Jane Smith', 'jane@example.com', '+0987654321', 'Tech Startup', 'Demo Request', 'We are interested in scheduling a product demo.', 'new', 'high', 'pricing_page');

