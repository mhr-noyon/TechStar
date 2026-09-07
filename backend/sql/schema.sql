-- =========================================================
-- TECHSTAR DATABASE MASTER SCHEMA
-- PostgreSQL / Supabase Schema Definition
-- Consolidated from all database specifications and migrations
-- =========================================================

-- ---------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------
-- 2. ENUM TYPES
-- ---------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'OPERATOR',
            'SUPERVISOR',
            'TECHNICIAN',
            'CUSTOMER'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM (
            'RECEIVED',
            'ASSIGNED',
            'REPAIRING',
            'WAITING_FOR_PARTS',
            'READY_FOR_DELIVERY',
            'COMPLETED',
            'FAILED',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_priority') THEN
        CREATE TYPE request_priority AS ENUM (
            'NORMAL',
            'HIGH',
            'URGENT'
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_type') THEN
        CREATE TYPE notifications_type AS ENUM (
            'CHAT',
            'OVERDUE'
        );
    END IF;
END $$;

-- ---------------------------------------------------------
-- 3. USERS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 4. TECHNICIANS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS technicians (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization VARCHAR(150),
    max_capacity INTEGER NOT NULL CHECK (max_capacity > 0),
    active_jobs INTEGER NOT NULL DEFAULT 0 CHECK (active_jobs >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (active_jobs <= max_capacity)
);

-- ---------------------------------------------------------
-- 5. SERVICE REQUESTS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_requests (
    id BIGSERIAL PRIMARY KEY,
    customer_access_code CHAR(6) NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id),
    technician_id UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    device_info TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    payment_amount NUMERIC(12, 2) CHECK (payment_amount IS NULL OR payment_amount >= 0),
    priority request_priority NOT NULL DEFAULT 'NORMAL',
    status request_status NOT NULL DEFAULT 'RECEIVED',
    progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    expected_delivery_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 6. SERVICE REQUEST HISTORY
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_request_history (
    id BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES users(id),
    old_status request_status,
    new_status request_status,
    old_progress SMALLINT CHECK (old_progress IS NULL OR old_progress BETWEEN 0 AND 100),
    new_progress SMALLINT CHECK (new_progress IS NULL OR new_progress BETWEEN 0 AND 100),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 7. SERVICE REQUEST EMAIL LOGS
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_request_emails (
    service_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
    status request_status NOT NULL DEFAULT 'RECEIVED',
    email_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (service_id, status)
);

-- ---------------------------------------------------------
-- 8. CHAT MESSAGES
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 9. NOTIFICATIONS & TRACKING
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id BIGINT REFERENCES service_requests(id) ON DELETE CASCADE,
    chat_message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS user_notification_track (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_notification UNIQUE (notification_id, user_id)
);

-- ---------------------------------------------------------
-- 10. INDEXES
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_technicians_available ON technicians(is_available);
CREATE INDEX IF NOT EXISTS idx_technicians_active_jobs ON technicians(active_jobs);
CREATE INDEX IF NOT EXISTS idx_service_requests_access_code ON service_requests(customer_access_code);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_technician_id ON service_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_by ON service_requests(created_by);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_priority ON service_requests(priority);
CREATE INDEX IF NOT EXISTS idx_service_requests_delivery ON service_requests(expected_delivery_at);
CREATE INDEX IF NOT EXISTS idx_history_service_request_id ON service_request_history(service_request_id);
CREATE INDEX IF NOT EXISTS idx_history_changed_by ON service_request_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON service_request_history(created_at);
CREATE INDEX IF NOT EXISTS idx_service_request_emails_sent_at ON service_request_emails(email_sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_request_emails_status ON service_request_emails(service_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_chat_message_id ON notifications(chat_message_id);
CREATE INDEX IF NOT EXISTS idx_notifications_service_request_id ON notifications(service_request_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_track_user ON user_notification_track(user_id, is_read);

-- ---------------------------------------------------------
-- 11. TRIGGERS & FUNCTIONS
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS technicians_updated_at ON technicians;
CREATE TRIGGER technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS service_requests_updated_at ON service_requests;
CREATE TRIGGER service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Technician Role Validation
CREATE OR REPLACE FUNCTION validate_technician_user()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value FROM users WHERE id = NEW.user_id;
    IF user_role_value IS NULL THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;
    IF user_role_value <> 'TECHNICIAN' THEN
        RAISE EXCEPTION 'Only users with TECHNICIAN role can have a technician record';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS technician_role_validation ON technicians;
CREATE TRIGGER technician_role_validation BEFORE INSERT OR UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION validate_technician_user();

-- Service Request Role Validation
CREATE OR REPLACE FUNCTION validate_service_request_users()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    customer_role_value user_role;
    technician_role_value user_role;
BEGIN
    SELECT role INTO customer_role_value FROM users WHERE id = NEW.customer_id;
    IF customer_role_value IS NULL THEN
        RAISE EXCEPTION 'Customer user does not exist';
    END IF;
    IF customer_role_value <> 'CUSTOMER' THEN
        RAISE EXCEPTION 'service_requests.customer_id must reference a CUSTOMER';
    END IF;

    IF NEW.technician_id IS NOT NULL THEN
        SELECT role INTO technician_role_value FROM users WHERE id = NEW.technician_id;
        IF technician_role_value IS NULL THEN
            RAISE EXCEPTION 'Technician user does not exist';
        END IF;
        IF technician_role_value <> 'TECHNICIAN' THEN
            RAISE EXCEPTION 'service_requests.technician_id must reference a TECHNICIAN';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_request_user_validation ON service_requests;
CREATE TRIGGER service_request_user_validation BEFORE INSERT OR UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION validate_service_request_users();

-- History Automated Triggers
CREATE OR REPLACE FUNCTION create_initial_request_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO service_request_history (
        service_request_id, changed_by, old_status, new_status, old_progress, new_progress, note
    ) VALUES (
        NEW.id, NEW.created_by, NULL, NEW.status, NULL, NEW.progress, 'Service request created'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_request_initial_history ON service_requests;
CREATE TRIGGER service_request_initial_history AFTER INSERT ON service_requests FOR EACH ROW EXECUTE FUNCTION create_initial_request_history();

-- ---------------------------------------------------------
-- 12. RPC NOTIFICATION FUNCTIONS
-- ---------------------------------------------------------

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
LANGUAGE sql STABLE AS $$
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
    LEFT JOIN user_notification_track unt ON unt.notification_id = n.id AND unt.user_id = p_user_id
    LEFT JOIN service_requests s ON n.service_request_id = s.id
    LEFT JOIN chat_messages c ON n.chat_message_id = c.id
    WHERE
        (n.type = 'CHAT' AND n.chat_message_id IS NOT NULL AND c.sender_id <> p_user_id)
        OR
        (n.type = 'OVERDUE' AND n.service_request_id IS NOT NULL AND (
            s.created_by = p_user_id OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user_id AND u.role = 'SUPERVISOR')
        ))
    ORDER BY n.created_at DESC
    LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION count_unread_user_notifications(p_user_id UUID)
RETURNS BIGINT LANGUAGE sql STABLE AS $$
    SELECT COUNT(*)
    FROM notifications n
    LEFT JOIN user_notification_track unt ON unt.notification_id = n.id AND unt.user_id = p_user_id
    LEFT JOIN service_requests s ON n.service_request_id = s.id
    LEFT JOIN chat_messages c ON n.chat_message_id = c.id
    WHERE
        COALESCE(unt.is_read, FALSE) = FALSE
        AND (
            (n.type = 'CHAT' AND n.chat_message_id IS NOT NULL AND c.sender_id <> p_user_id)
            OR
            (n.type = 'OVERDUE' AND n.service_request_id IS NOT NULL AND (
                s.created_by = p_user_id OR EXISTS (SELECT 1 FROM users u WHERE u.id = p_user_id AND u.role = 'SUPERVISOR')
            ))
        );
$$;

CREATE OR REPLACE FUNCTION mark_all_user_notifications_as_read(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql VOLATILE AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    INSERT INTO user_notification_track (notification_id, user_id, is_read)
    SELECT notification_id, p_user_id, TRUE
    FROM get_user_notifications(p_user_id, 10000)
    ON CONFLICT (notification_id, user_id) DO UPDATE SET is_read = TRUE;

    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$;

CREATE OR REPLACE FUNCTION create_overdue_notifications()
RETURNS INTEGER LANGUAGE plpgsql VOLATILE AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO notifications (service_request_id, type, message)
    SELECT
        sr.id,
        'OVERDUE',
        format('Service request #SR-%s for %s was expected by %s.', sr.id, COALESCE(sr.device_info, 'device'), to_char(sr.expected_delivery_at, 'YYYY-MM-DD HH24:MI:SS'))
    FROM service_requests sr
    WHERE sr.expected_delivery_at IS NOT NULL
      AND sr.expected_delivery_at < NOW()
      AND sr.status NOT IN ('COMPLETED', 'CANCELLED', 'FAILED', 'READY_FOR_DELIVERY')
      AND NOT EXISTS (
          SELECT 1 FROM notifications n WHERE n.type = 'OVERDUE' AND n.service_request_id = sr.id
      );

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$;