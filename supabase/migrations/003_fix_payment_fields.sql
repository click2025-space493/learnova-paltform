-- Fix payment field length constraints
ALTER TABLE courses ALTER COLUMN instapay_number TYPE VARCHAR(50);
ALTER TABLE courses ALTER COLUMN vodafone_cash_number TYPE VARCHAR(50);

-- Also update the enrollment_requests payment_method constraint to be more flexible
ALTER TABLE enrollment_requests ALTER COLUMN payment_method TYPE VARCHAR(50);
ALTER TABLE enrollment_requests DROP CONSTRAINT IF EXISTS enrollment_requests_payment_method_check;
ALTER TABLE enrollment_requests ADD CONSTRAINT enrollment_requests_payment_method_check 
  CHECK (payment_method IN ('instapay', 'vodafone_cash'));

-- Increase payment_reference field size as well
ALTER TABLE enrollment_requests ALTER COLUMN payment_reference TYPE VARCHAR(200);
