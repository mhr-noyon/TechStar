-- =========================================================
-- TECHSTAR DATABASE SCHEMA
-- PostgreSQL / Supabase
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
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'user_role'
    ) THEN
        CREATE TYPE user_role AS ENUM (
            'OPERATOR',
            'SUPERVISOR',
            'TECHNICIAN',
            'CUSTOMER'
        );
    END IF;
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'request_status'
    ) THEN
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
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'request_priority'
    ) THEN
        CREATE TYPE request_priority AS ENUM (
            'NORMAL',
            'HIGH',
            'URGENT'
        );
    END IF;
END
$$;


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

    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id)
        ON DELETE CASCADE,

    specialization VARCHAR(150),

    max_capacity INTEGER NOT NULL
        CHECK (max_capacity > 0),

    active_jobs INTEGER NOT NULL DEFAULT 0
        CHECK (active_jobs >= 0),

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

    customer_id UUID NOT NULL
        REFERENCES users(id),

    technician_id UUID
        REFERENCES users(id),

    created_by UUID NOT NULL
        REFERENCES users(id),

    device_info TEXT NOT NULL,

    problem_description TEXT NOT NULL,

    payment_amount NUMERIC(12, 2)
        CHECK (payment_amount IS NULL OR payment_amount >= 0),

    priority request_priority NOT NULL
        DEFAULT 'NORMAL',

    status request_status NOT NULL
        DEFAULT 'RECEIVED',

    progress SMALLINT NOT NULL
        DEFAULT 0
        CHECK (progress BETWEEN 0 AND 100),

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

    service_request_id BIGINT NOT NULL
        REFERENCES service_requests(id)
        ON DELETE CASCADE,

    changed_by UUID NOT NULL
        REFERENCES users(id),

    old_status request_status,

    new_status request_status,

    old_progress SMALLINT
        CHECK (
            old_progress IS NULL
            OR old_progress BETWEEN 0 AND 100
        ),

    new_progress SMALLINT
        CHECK (
            new_progress IS NULL
            OR new_progress BETWEEN 0 AND 100
        ),

    note TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------
-- 7. INDEXES
-- ---------------------------------------------------------

-- Users

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);


-- Technicians

CREATE INDEX IF NOT EXISTS idx_technicians_available
ON technicians(is_available);

CREATE INDEX IF NOT EXISTS idx_technicians_active_jobs
ON technicians(active_jobs);


-- Service Requests

CREATE INDEX IF NOT EXISTS idx_service_requests_customer_id
ON service_requests(customer_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_technician_id
ON service_requests(technician_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_created_by
ON service_requests(created_by);

CREATE INDEX IF NOT EXISTS idx_service_requests_status
ON service_requests(status);

CREATE INDEX IF NOT EXISTS idx_service_requests_priority
ON service_requests(priority);

CREATE INDEX IF NOT EXISTS idx_service_requests_delivery
ON service_requests(expected_delivery_at);


-- History

CREATE INDEX IF NOT EXISTS idx_history_service_request_id
ON service_request_history(service_request_id);

CREATE INDEX IF NOT EXISTS idx_history_changed_by
ON service_request_history(changed_by);

CREATE INDEX IF NOT EXISTS idx_history_created_at
ON service_request_history(created_at);


-- ---------------------------------------------------------
-- 8. UPDATED_AT FUNCTION
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();

    RETURN NEW;
END;
$$;


-- ---------------------------------------------------------
-- 9. UPDATED_AT TRIGGERS
-- ---------------------------------------------------------

DROP TRIGGER IF EXISTS users_updated_at
ON users;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


DROP TRIGGER IF EXISTS technicians_updated_at
ON technicians;

CREATE TRIGGER technicians_updated_at
BEFORE UPDATE ON technicians
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


DROP TRIGGER IF EXISTS service_requests_updated_at
ON service_requests;

CREATE TRIGGER service_requests_updated_at
BEFORE UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


-- ---------------------------------------------------------
-- 10. BASIC ROLE VALIDATION
-- ---------------------------------------------------------

-- A technician record must belong to a TECHNICIAN user.

CREATE OR REPLACE FUNCTION validate_technician_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_role_value user_role;
BEGIN

    SELECT role
    INTO user_role_value
    FROM users
    WHERE id = NEW.user_id;


    IF user_role_value IS NULL THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;


    IF user_role_value <> 'TECHNICIAN' THEN
        RAISE EXCEPTION
            'Only users with TECHNICIAN role can have a technician record';
    END IF;


    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS technician_role_validation
ON technicians;

CREATE TRIGGER technician_role_validation
BEFORE INSERT OR UPDATE ON technicians
FOR EACH ROW
EXECUTE FUNCTION validate_technician_user();


-- ---------------------------------------------------------
-- 11. SERVICE REQUEST USER VALIDATION
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_service_request_users()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    customer_role_value user_role;
    technician_role_value user_role;
BEGIN

    -- Validate customer

    SELECT role
    INTO customer_role_value
    FROM users
    WHERE id = NEW.customer_id;


    IF customer_role_value IS NULL THEN
        RAISE EXCEPTION 'Customer user does not exist';
    END IF;


    IF customer_role_value <> 'CUSTOMER' THEN
        RAISE EXCEPTION
            'service_requests.customer_id must reference a CUSTOMER';
    END IF;


    -- Validate technician if assigned

    IF NEW.technician_id IS NOT NULL THEN

        SELECT role
        INTO technician_role_value
        FROM users
        WHERE id = NEW.technician_id;


        IF technician_role_value IS NULL THEN
            RAISE EXCEPTION 'Technician user does not exist';
        END IF;


        IF technician_role_value <> 'TECHNICIAN' THEN
            RAISE EXCEPTION
                'service_requests.technician_id must reference a TECHNICIAN';
        END IF;

    END IF;


    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS service_request_user_validation
ON service_requests;

CREATE TRIGGER service_request_user_validation
BEFORE INSERT OR UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION validate_service_request_users();


-- ---------------------------------------------------------
-- 12. SERVICE REQUEST INITIAL HISTORY
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION create_initial_request_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    INSERT INTO service_request_history (
        service_request_id,
        changed_by,
        old_status,
        new_status,
        old_progress,
        new_progress,
        note
    )
    VALUES (
        NEW.id,
        NEW.created_by,
        NULL,
        NEW.status,
        NULL,
        NEW.progress,
        'Service request created'
    );


    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS service_request_initial_history
ON service_requests;

CREATE TRIGGER service_request_initial_history
AFTER INSERT ON service_requests
FOR EACH ROW
EXECUTE FUNCTION create_initial_request_history();


CREATE OR REPLACE FUNCTION create_request_update_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO service_request_history (
        service_request_id,
        changed_by,
        old_status,
        new_status,
        old_progress,
        new_progress,
        note
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.created_by, NULL),
        OLD.status,
        NEW.status,
        OLD.progress,
        NEW.progress,
        'Service request updated'
    );

    RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS service_request_update_history
ON service_requests;

CREATE TRIGGER service_request_update_history
AFTER UPDATE ON service_requests
FOR EACH ROW
EXECUTE FUNCTION create_request_update_history();