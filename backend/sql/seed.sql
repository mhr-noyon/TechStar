-- =========================================================
-- TECHSTAR SEED DATA
-- Development / Testing Only
-- =========================================================


-- ---------------------------------------------------------
-- 1. USERS
-- ---------------------------------------------------------

INSERT INTO users (
    id,
    name,
    email,
    phone,
    password_hash,
    role
)
VALUES

(
    '10000000-0000-0000-0000-000000000001',
    'System Operator',
    'operator@techstar.com',
    '01710000001',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'OPERATOR'
),

(
    '10000000-0000-0000-0000-000000000002',
    'System Supervisor',
    'supervisor@techstar.com',
    '01710000002',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'SUPERVISOR'
),

(
    '10000000-0000-0000-0000-000000000003',
    'Rahim Ahmed',
    'rahim@techstar.com',
    '01710000003',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'TECHNICIAN'
),

(
    '10000000-0000-0000-0000-000000000004',
    'Karim Hasan',
    'karim@techstar.com',
    '01710000004',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'TECHNICIAN'
),

(
    '10000000-0000-0000-0000-000000000005',
    'Noyon Customer',
    'customer1@example.com',
    '01710000005',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'CUSTOMER'
),

(
    '10000000-0000-0000-0000-000000000006',
    'Sakib Customer',
    'customer2@example.com',
    '01710000006',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'CUSTOMER'
);


-- ---------------------------------------------------------
-- 2. TECHNICIANS
-- ---------------------------------------------------------

INSERT INTO technicians (
    id,
    user_id,
    specialization,
    max_capacity,
    active_jobs,
    is_available
)
VALUES

(
    1,
    '10000000-0000-0000-0000-000000000003',
    'Laptop & Desktop Repair',
    5,
    1,
    TRUE
),

(
    2,
    '10000000-0000-0000-0000-000000000004',
    'Printer & Networking',
    4,
    0,
    TRUE
);


-- ---------------------------------------------------------
-- 3. DEVICES
-- ---------------------------------------------------------

INSERT INTO devices (
    id,
    customer_id,
    device_type,
    brand,
    model,
    serial_number
)
VALUES

(
    1,
    '10000000-0000-0000-0000-000000000005',
    'Laptop',
    'Dell',
    'Inspiron 15',
    'DL-IN15-001'
),

(
    2,
    '10000000-0000-0000-0000-000000000005',
    'Laptop',
    'HP',
    'Pavilion 15',
    'HP-PV15-001'
),

(
    3,
    '10000000-0000-0000-0000-000000000006',
    'Printer',
    'Canon',
    'LBP6030',
    'CN-LBP-001'
);


-- ---------------------------------------------------------
-- 4. SERVICE REQUESTS
-- ---------------------------------------------------------

INSERT INTO service_requests (
    id,
    customer_id,
    device_id,
    technician_id,
    created_by,
    problem_description,
    priority,
    status,
    progress,
    expected_delivery_at,
    completed_at
)
VALUES

(
    1,
    '10000000-0000-0000-0000-000000000005',
    1,
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Laptop is overheating and shutting down unexpectedly.',
    'HIGH',
    'REPAIRING',
    50,
    NOW() + INTERVAL '2 days',
    NULL
),

(
    2,
    '10000000-0000-0000-0000-000000000005',
    2,
    NULL,
    '10000000-0000-0000-0000-000000000001',
    'Laptop screen is flickering intermittently.',
    'NORMAL',
    'RECEIVED',
    0,
    NOW() + INTERVAL '5 days',
    NULL
),

(
    3,
    '10000000-0000-0000-0000-000000000006',
    3,
    '10000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    'Printer is producing paper jams during printing.',
    'URGENT',
    'ASSIGNED',
    10,
    NOW() + INTERVAL '1 day',
    NULL
);


-- ---------------------------------------------------------
-- 5. SERVICE REQUEST HISTORY
-- ---------------------------------------------------------

INSERT INTO service_request_history (
    service_request_id,
    changed_by,
    old_status,
    new_status,
    old_progress,
    new_progress,
    note
)
VALUES

(
    1,
    '10000000-0000-0000-0000-000000000001',
    NULL,
    'RECEIVED',
    NULL,
    0,
    'Service request created'
),

(
    1,
    '10000000-0000-0000-0000-000000000001',
    'RECEIVED',
    'ASSIGNED',
    0,
    0,
    'Assigned to Rahim Ahmed'
),

(
    1,
    '10000000-0000-0000-0000-000000000003',
    'ASSIGNED',
    'REPAIRING',
    0,
    50,
    'Diagnosis completed and repair started'
),

(
    2,
    '10000000-0000-0000-0000-000000000001',
    NULL,
    'RECEIVED',
    NULL,
    0,
    'Service request created'
),

(
    3,
    '10000000-0000-0000-0000-000000000001',
    NULL,
    'RECEIVED',
    NULL,
    0,
    'Service request created'
),

(
    3,
    '10000000-0000-0000-0000-000000000001',
    'RECEIVED',
    'ASSIGNED',
    0,
    10,
    'Assigned to Karim Hasan'
);