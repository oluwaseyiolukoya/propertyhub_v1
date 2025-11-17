-- Add ticketNumber column to landing_page_submissions table
-- This allows us to have formatted ticket IDs like TK-748767

-- Add the column
ALTER TABLE landing_page_submissions
ADD COLUMN IF NOT EXISTS "ticketNumber" SERIAL UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_landing_page_submissions_ticket_number
ON landing_page_submissions("ticketNumber");

-- Backfill existing records with sequential numbers starting from 100000
DO $$
DECLARE
  rec RECORD;
  counter INT := 100000;
BEGIN
  FOR rec IN
    SELECT id FROM landing_page_submissions
    WHERE "ticketNumber" IS NULL
    ORDER BY "createdAt" ASC
  LOOP
    UPDATE landing_page_submissions
    SET "ticketNumber" = counter
    WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- Set the sequence to start from the next number
SELECT setval(
  pg_get_serial_sequence('landing_page_submissions', 'ticketNumber'),
  COALESCE((SELECT MAX("ticketNumber") FROM landing_page_submissions), 100000) + 1,
  false
);

