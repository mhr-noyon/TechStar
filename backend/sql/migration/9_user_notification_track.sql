-- =========================================================
-- NEW USER NOTIFICATION TRACKING SYSTEM
-- =========================================================

CREATE TABLE IF NOT EXISTS user_notification_track (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    notification_id UUID NOT NULL
        REFERENCES notifications(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT unique_user_notification
        UNIQUE (notification_id, user_id)
);

CREATE OR REPLACE FUNCTION get_user_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    notification_id UUID,
    user_id UUID,
    is_read BOOLEAN,
    service_request_id BIGINT,
    chat_message_id UUID,
    type notifications_type,
    message TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        n.id AS notification_id,
        p_user_id AS user_id,
        COALESCE(unt.is_read, FALSE) AS is_read,
        n.service_request_id,
        n.chat_message_id,
        n.type,
        n.message,
        n.created_at
    FROM notifications n

    LEFT JOIN user_notification_track unt
        ON unt.notification_id = n.id
        AND unt.user_id = p_user_id

    LEFT JOIN service_requests s
        ON n.service_request_id = s.id

    LEFT JOIN chat_messages c
        ON n.chat_message_id = c.id

    WHERE
        (
            -- CHAT:
            -- All operators and supervisors except the sender
            n.type = 'CHAT'
            AND n.chat_message_id IS NOT NULL
            AND c.sender_id <> p_user_id
        )

        OR

        (
            -- OVERDUE:
            -- Service request creator or supervisor
            n.type = 'OVERDUE'
            AND n.service_request_id IS NOT NULL
            AND (
                s.created_by = p_user_id
                OR EXISTS (
                    SELECT 1
                    FROM users u
                    WHERE u.id = p_user_id
                      AND u.role = 'SUPERVISOR'
                )
            )
        )

    ORDER BY n.created_at DESC
    LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION count_unread_user_notifications(
    p_user_id UUID
)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)
    FROM notifications n

    LEFT JOIN user_notification_track unt
        ON unt.notification_id = n.id
        AND unt.user_id = p_user_id

    LEFT JOIN service_requests s
        ON n.service_request_id = s.id

    LEFT JOIN chat_messages c
        ON n.chat_message_id = c.id

    WHERE
        COALESCE(unt.is_read, FALSE) = FALSE

        AND (
            (
                n.type = 'CHAT'
                AND n.chat_message_id IS NOT NULL
                AND c.sender_id <> p_user_id
            )
            OR
            (
                n.type = 'OVERDUE'
                AND n.service_request_id IS NOT NULL
                AND s.created_by <> p_user_id
            )
        );
$$;