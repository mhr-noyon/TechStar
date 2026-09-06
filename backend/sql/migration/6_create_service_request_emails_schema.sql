-- Migration for Service Request Email Delivery Tracking
CREATE TABLE IF NOT EXISTS service_request_emails (
    service_id BIGINT PRIMARY KEY REFERENCES service_requests(id) ON DELETE CASCADE,
    email_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_request_emails_sent_at 
ON service_request_emails(email_sent_at DESC);
