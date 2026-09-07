-- =========================================================
-- TECHSTAR DEMO DATA & SEED EXECUTION
-- Password for all staff and demo users is: password123
-- Bcrypt Hash: $2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy
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

-- Customers
(
    '11111111-1111-1111-1111-111111111111',
    'Rahim Ahmed',
    'rahim@example.com',
    '01710000001',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'CUSTOMER'
),
(
    '22222222-2222-2222-2222-222222222222',
    'Nusrat Jahan',
    'nusrat@example.com',
    '01710000002',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'CUSTOMER'
),
(
    '33333333-3333-3333-3333-333333333333',
    'Tanvir Hasan',
    'tanvir@example.com',
    '01710000003',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'CUSTOMER'
),
(
    '44444444-4444-4444-4444-444444444444',
    'Sadia Islam',
    'sadia@example.com',
    '01710000004',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'CUSTOMER'
),

-- Operators
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Karim Hossain',
    'karim@techstar.com',
    '01710000101',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'OPERATOR'
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Mim Akter',
    'mim@techstar.com',
    '01710000102',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'OPERATOR'
),

-- Supervisor
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Fahim Rahman',
    'fahim@techstar.com',
    '01710000201',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'SUPERVISOR'
),

-- Technicians
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Arif Mahmud',
    'arif@techstar.com',
    '01710000301',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'TECHNICIAN'
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Sakib Khan',
    'sakib@techstar.com',
    '01710000302',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'TECHNICIAN'
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'Mehedi Hasan',
    'mehedi@techstar.com',
    '01710000303',
    '$2b$10$xtIkawpTIXgkRnlH5BGImO.l3P9LBNK/RJhJJ2sQse0uHL9ATPFoy',
    'TECHNICIAN'
)
ON CONFLICT (id) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;


-- ---------------------------------------------------------
-- 2. TECHNICIANS
-- ---------------------------------------------------------

INSERT INTO technicians (
    user_id,
    specialization,
    max_capacity,
    active_jobs,
    is_available
)
VALUES
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Laptop & Desktop Repair',
    5,
    2,
    TRUE
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Printer & Networking',
    4,
    1,
    TRUE
),
(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'Laptop Hardware & Software',
    5,
    2,
    TRUE
)
ON CONFLICT (user_id) DO UPDATE SET
    max_capacity = EXCLUDED.max_capacity,
    is_available = EXCLUDED.is_available;


-- ---------------------------------------------------------
-- 3. SERVICE REQUESTS
-- ---------------------------------------------------------

INSERT INTO service_requests (
    id,
    customer_id,
    customer_access_code,
    technician_id,
    created_by,
    device_info,
    problem_description,
    payment_amount,
    priority,
    status,
    progress,
    expected_delivery_at,
    completed_at
)
VALUES

-- Request 1: Repairing
(
    1,
    '11111111-1111-1111-1111-111111111111',
    '610241',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Type: Laptop | Brand: Dell | Model: Inspiron 15 3520 | RAM: 16GB | Storage: 512GB SSD',
    'Laptop is overheating and shutting down randomly during load.',
    3500.00,
    'HIGH',
    'REPAIRING',
    65,
    NOW() + INTERVAL '2 days',
    NULL
),

-- Request 2: Waiting for parts
(
    2,
    '22222222-2222-2222-2222-222222222222',
    '742905',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Type: Laptop | Brand: HP | Model: Pavilion 15 | RAM: 8GB | Storage: 256GB SSD',
    'Laptop keyboard is unresponsive. Replacement keyboard unit required.',
    1800.00,
    'NORMAL',
    'WAITING_FOR_PARTS',
    45,
    NOW() + INTERVAL '4 days',
    NULL
),

-- Request 3: Ready for delivery
(
    3,
    '33333333-3333-3333-3333-333333333333',
    '183604',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Type: Desktop | Brand: ASUS | Model: ExpertCenter D5 | RAM: 16GB | Storage: 1TB HDD',
    'Desktop does not turn on. Power supply replaced and unit fully stress tested.',
    4500.00,
    'URGENT',
    'READY_FOR_DELIVERY',
    100,
    NOW() + INTERVAL '1 day',
    NULL
),

-- Request 4: Received
(
    4,
    '44444444-4444-4444-4444-444444444444',
    '529817',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Type: Laptop | Brand: Lenovo | Model: IdeaPad 3 | RAM: 8GB | Storage: 512GB SSD',
    'Laptop screen flickers intermittently.',
    2200.00,
    'NORMAL',
    'RECEIVED',
    0,
    NOW() + INTERVAL '5 days',
    NULL
),

-- Request 5: Assigned
(
    5,
    '11111111-1111-1111-1111-111111111111',
    '304672',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Type: Printer | Brand: HP | Model: LaserJet Pro M404dn',
    'Faded printing output and paper jam issue.',
    1200.00,
    'HIGH',
    'ASSIGNED',
    10,
    NOW() + INTERVAL '3 days',
    NULL
),

-- Request 6: Completed
(
    6,
    '22222222-2222-2222-2222-222222222222',
    '891356',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Type: Laptop | Brand: Acer | Model: Aspire 5 | RAM: 8GB | Storage: 512GB SSD',
    'OS optimization and thermal maintenance performed successfully.',
    2800.00,
    'NORMAL',
    'COMPLETED',
    100,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    progress = EXCLUDED.progress,
    payment_amount = EXCLUDED.payment_amount;

SELECT setval('service_requests_id_seq', (SELECT MAX(id) FROM service_requests));


-- ---------------------------------------------------------
-- 4. STAFF CHAT MESSAGES SEED
-- ---------------------------------------------------------

INSERT INTO chat_messages (
    id,
    sender_id,
    content,
    created_at
)
VALUES
(
    '77777777-7777-7777-7777-777777777771',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Welcome team! Request #SR-1 (Dell Inspiron) has been marked high priority.',
    NOW() - INTERVAL '3 hours'
),
(
    '77777777-7777-7777-7777-777777777772',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Received. Please ensure expected delivery dates are updated accurately for customers.',
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------
-- 5. NOTIFICATIONS SEED
-- ---------------------------------------------------------

INSERT INTO notifications (
    id,
    service_request_id,
    chat_message_id,
    type,
    message,
    created_at
)
VALUES
(
    '88888888-8888-8888-8888-888888888881',
    3,
    NULL,
    'OVERDUE',
    'Service request #SR-3 for ASUS ExpertCenter D5 was expected by yesterday.',
    NOW() - INTERVAL '1 hour'
),
(
    '88888888-8888-8888-8888-888888888882',
    NULL,
    '77777777-7777-7777-7777-777777777772',
    'CHAT',
    'Received. Please ensure expected delivery dates are updated accurately for customers.',
    NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;