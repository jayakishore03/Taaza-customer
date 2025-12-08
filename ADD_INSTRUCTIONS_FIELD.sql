-- ========================================
-- ADD SPECIAL_INSTRUCTIONS FIELD TO ORDERS TABLE
-- Run this in Supabase SQL Editor
-- ========================================

-- Add special_instructions column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS special_instructions text;

-- Add a comment to explain the field
COMMENT ON COLUMN orders.special_instructions IS 'Customer special instructions or notes for the order (e.g., delivery time preference, cooking instructions)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'special_instructions';

-- ========================================
-- SUCCESS!
-- The orders table now has special_instructions field
-- ========================================

