-- =========================================================
-- MIGRATION 3: Populate payment_amount for Demo Service Requests
-- =========================================================

UPDATE service_requests SET payment_amount = 3500.00 WHERE id = 1 AND payment_amount IS NULL;
UPDATE service_requests SET payment_amount = 1800.00 WHERE id = 2 AND payment_amount IS NULL;
UPDATE service_requests SET payment_amount = 4500.00 WHERE id = 3 AND payment_amount IS NULL;
UPDATE service_requests SET payment_amount = 2200.00 WHERE id = 4 AND payment_amount IS NULL;
UPDATE service_requests SET payment_amount = 1200.00 WHERE id = 5 AND payment_amount IS NULL;
UPDATE service_requests SET payment_amount = 2800.00 WHERE id = 6 AND payment_amount IS NULL;
UPDATE service_requests SET payment_amount = 1500.00 WHERE id = 7 AND payment_amount IS NULL;
UPDATE service_requests SET payment_amount = 0.00 WHERE id = 8 AND payment_amount IS NULL;
