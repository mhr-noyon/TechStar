-- Run once on an existing database before using customer tracking.
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS customer_access_code CHAR(6);

UPDATE service_requests
SET customer_access_code = LPAD((100000 + floor(random() * 900000))::text, 6, '0')
WHERE customer_access_code IS NULL;

ALTER TABLE service_requests
ALTER COLUMN customer_access_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_access_code
ON service_requests(customer_access_code);
