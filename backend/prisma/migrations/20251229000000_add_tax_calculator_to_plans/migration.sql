-- Add tax_calculator feature to Professional, Business, and Enterprise plans
-- This migration ensures the tax calculator feature is automatically available
-- in production after deployment, just like other code changes
--
-- Note: features column is JSONB, so we need to handle it as JSON, not text[]

-- Helper function to add tax_calculator to features JSONB array
-- This handles both array and object formats
DO $$
DECLARE
  plan_record RECORD;
  current_features JSONB;
  features_array JSONB;
  has_tax BOOLEAN;
BEGIN
  -- Process each plan that should have tax_calculator
  FOR plan_record IN
    SELECT id, name, features
    FROM plans
    WHERE name IN ('Professional', 'Business', 'Enterprise')
      AND category = 'property_management'
  LOOP
    -- Initialize
    current_features := plan_record.features;
    has_tax := false;

    -- Check if features already contains tax_calculator
    IF current_features IS NOT NULL THEN
      -- Check if it's an array
      IF jsonb_typeof(current_features) = 'array' THEN
        -- Check if array contains tax_calculator
        has_tax := (
          current_features::text LIKE '%tax_calculator%' OR
          current_features::text LIKE '%Tax Calculator%'
        );

        IF NOT has_tax THEN
          -- Append to array
          features_array := current_features || '["Tax Calculator", "tax_calculator"]'::jsonb;
        ELSE
          features_array := current_features;
        END IF;
      ELSE
        -- If it's not an array, convert to array first
        features_array := '[]'::jsonb || '["Tax Calculator", "tax_calculator"]'::jsonb;
      END IF;
    ELSE
      -- Features is NULL, create new array
      features_array := '["Tax Calculator", "tax_calculator"]'::jsonb;
    END IF;

    -- Update the plan if needed
    IF NOT has_tax THEN
      UPDATE plans
      SET features = features_array
      WHERE id = plan_record.id;

      RAISE NOTICE 'Updated plan % (%) with tax_calculator feature', plan_record.name, plan_record.id;
    ELSE
      RAISE NOTICE 'Plan % (%) already has tax_calculator feature', plan_record.name, plan_record.id;
    END IF;
  END LOOP;
END $$;

