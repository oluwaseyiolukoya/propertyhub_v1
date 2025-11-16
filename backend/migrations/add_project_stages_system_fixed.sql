-- Migration: Add Project Stages System (Fixed)
-- Description: Creates tables for stage-based project progress tracking
-- Date: 2024-11-16
-- Fixed: Changed UUID to VARCHAR to match developer_projects.id type

-- Drop tables if they exist (from failed migration)
DROP TABLE IF EXISTS project_stages CASCADE;
DROP TABLE IF EXISTS project_stage_template_items CASCADE;
DROP TABLE IF EXISTS project_stage_templates CASCADE;

-- Create project_stage_templates table
CREATE TABLE IF NOT EXISTS project_stage_templates (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    "projectType" VARCHAR(100) NOT NULL,
    "isDefault" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_stage_template_items table
CREATE TABLE IF NOT EXISTS project_stage_template_items (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "templateId" VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    weight DECIMAL(10, 2) DEFAULT 1,
    "isOptional" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("templateId") REFERENCES project_stage_templates(id) ON DELETE CASCADE
);

-- Create indexes for template items
CREATE INDEX IF NOT EXISTS idx_template_items_template_id ON project_stage_template_items("templateId");
CREATE INDEX IF NOT EXISTS idx_template_items_order ON project_stage_template_items("order");

-- Create project_stages table
CREATE TABLE IF NOT EXISTS project_stages (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "projectId" VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    weight DECIMAL(10, 2) DEFAULT 1,
    "isCompleted" BOOLEAN DEFAULT false,
    "completedAt" TIMESTAMP,
    "completedBy" VARCHAR(255),
    "isOptional" BOOLEAN DEFAULT false,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("projectId") REFERENCES developer_projects(id) ON DELETE CASCADE
);

-- Create indexes for project_stages
CREATE INDEX IF NOT EXISTS idx_project_stages_project_id ON project_stages("projectId");
CREATE INDEX IF NOT EXISTS idx_project_stages_order ON project_stages("order");
CREATE INDEX IF NOT EXISTS idx_project_stages_completed ON project_stages("isCompleted");

-- Add comments
COMMENT ON TABLE project_stage_templates IS 'Templates for industry-standard project stages';
COMMENT ON TABLE project_stage_template_items IS 'Individual stages within a template';
COMMENT ON TABLE project_stages IS 'Project-specific stages for progress tracking';

-- Success message
SELECT 'Project Stages System tables created successfully!' as message;

