ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12, 2)
CHECK (payment_amount IS NULL OR payment_amount >= 0);