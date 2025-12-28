-- Add tax_calculator feature to Professional, Business, and Enterprise plans
-- This migration ensures the tax calculator feature is automatically available
-- in production after deployment, just like other code changes

-- Update Professional plan
UPDATE plans
SET features = CASE
  WHEN features IS NULL THEN ARRAY['Tax Calculator', 'tax_calculator']::text[]
  WHEN NOT (features::text LIKE '%tax_calculator%' OR features::text LIKE '%Tax Calculator%') THEN
    array_append(
      array_append(features::text[], 'Tax Calculator'),
      'tax_calculator'
    )
  ELSE features
END,
updated_at = NOW()
WHERE name = 'Professional' 
  AND category = 'property_management'
  AND (features IS NULL OR NOT (features::text LIKE '%tax_calculator%' OR features::text LIKE '%Tax Calculator%'));

-- Update Business plan
UPDATE plans
SET features = CASE
  WHEN features IS NULL THEN ARRAY['Tax Calculator', 'tax_calculator']::text[]
  WHEN NOT (features::text LIKE '%tax_calculator%' OR features::text LIKE '%Tax Calculator%') THEN
    array_append(
      array_append(features::text[], 'Tax Calculator'),
      'tax_calculator'
    )
  ELSE features
END,
updated_at = NOW()
WHERE name = 'Business' 
  AND category = 'property_management'
  AND (features IS NULL OR NOT (features::text LIKE '%tax_calculator%' OR features::text LIKE '%Tax Calculator%'));

-- Update Enterprise plan
UPDATE plans
SET features = CASE
  WHEN features IS NULL THEN ARRAY['Tax Calculator', 'tax_calculator']::text[]
  WHEN NOT (features::text LIKE '%tax_calculator%' OR features::text LIKE '%Tax Calculator%') THEN
    array_append(
      array_append(features::text[], 'Tax Calculator'),
      'tax_calculator'
    )
  ELSE features
END,
updated_at = NOW()
WHERE name = 'Enterprise' 
  AND category = 'property_management'
  AND (features IS NULL OR NOT (features::text LIKE '%tax_calculator%' OR features::text LIKE '%Tax Calculator%'));

