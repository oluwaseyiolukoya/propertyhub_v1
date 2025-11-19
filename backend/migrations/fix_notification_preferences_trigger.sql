-- Fix create_default_notification_preferences trigger to use correct camelCase customerId column
-- Run with:
--   PGPASSWORD=Contrezz2025 psql -h localhost -U oluwaseyio -d contrezz -f backend/migrations/fix_notification_preferences_trigger.sql

CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Note: users table uses camelCase "customerId", not snake_case "customer_id"
    INSERT INTO notification_preferences (user_id, customer_id)
    VALUES (NEW.id, NEW."customerId")
    ON CONFLICT (user_id, customer_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


