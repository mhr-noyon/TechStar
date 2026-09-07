-- =========================================================
-- REPLACE OLD NOTIFICATION SYSTEM
-- =========================================================

DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'notifications_type'
    ) THEN
        CREATE TYPE notifications_type AS ENUM (
            'CHAT',
            'OVERDUE'
        );
    END IF;
END
$$;
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    service_request_id BIGINT
        REFERENCES service_requests(id)
        ON DELETE CASCADE,

    chat_message_id UUID
        REFERENCES chat_messages(id)
        ON DELETE CASCADE,

    type notifications_type NOT NULL,

    message TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT notifications_type_reference_check
    CHECK (
        (type = 'CHAT'
            AND chat_message_id IS NOT NULL
            AND service_request_id IS NULL)

        OR

        (type = 'OVERDUE'
            AND service_request_id IS NOT NULL
            AND chat_message_id IS NULL)
    )
);

CREATE INDEX idx_notifications_created_at
ON notifications(created_at DESC);

CREATE INDEX idx_notifications_chat_message_id
ON notifications(chat_message_id);

CREATE INDEX idx_notifications_service_request_id
ON notifications(service_request_id);