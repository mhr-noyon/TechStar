-- Migration for Service Request Email Delivery Tracking by Status
-- Updates service_request_emails table to include status column and composite primary key (service_id, status)

DO $$
BEGIN
    -- If the table exists with single primary key (service_id), alter it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_request_emails' AND column_name = 'service_id'
    ) THEN
        -- Add status column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'service_request_emails' AND column_name = 'status'
        ) THEN
            ALTER TABLE service_request_emails ADD COLUMN status request_status NOT NULL DEFAULT 'RECEIVED';
            
            -- Drop single-column primary key and add composite primary key
            ALTER TABLE service_request_emails DROP CONSTRAINT IF EXISTS service_request_emails_pkey;
            ALTER TABLE service_request_emails ADD PRIMARY KEY (service_id, status);
        END IF;
    ELSE
        -- Create table from scratch if it doesn't exist
        CREATE TABLE service_request_emails (
            service_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
            status request_status NOT NULL DEFAULT 'RECEIVED',
            email_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (service_id, status)
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_service_request_emails_status 
ON service_request_emails(service_id, status);
