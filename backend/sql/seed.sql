-- =========================================================
-- TECHSTAR DEMO DATA
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
    '$2b$10$DemoHashForRahim000000000000000000000000000000',
    'CUSTOMER'
),

(
    '22222222-2222-2222-2222-222222222222',
    'Nusrat Jahan',
    'nusrat@example.com',
    '01710000002',
    '$2b$10$DemoHashForNusrat00000000000000000000000000000',
    'CUSTOMER'
),

(
    '33333333-3333-3333-3333-333333333333',
    'Tanvir Hasan',
    'tanvir@example.com',
    '01710000003',
    '$2b$10$DemoHashForTanvir00000000000000000000000000000',
    'CUSTOMER'
),

(
    '44444444-4444-4444-4444-444444444444',
    'Sadia Islam',
    'sadia@example.com',
    '01710000004',
    '$2b$10$DemoHashForSadia000000000000000000000000000000',
    'CUSTOMER'
),


-- Operators
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Karim Hossain',
    'karim@techstar.com',
    '01710000101',
    '$2b$10$DemoHashForKarim000000000000000000000000000000',
    'OPERATOR'
),

(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Mim Akter',
    'mim@techstar.com',
    '01710000102',
    '$2b$10$DemoHashForMim00000000000000000000000000000000',
    'OPERATOR'
),


-- Supervisor
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Fahim Rahman',
    'fahim@techstar.com',
    '01710000201',
    '$2b$10$DemoHashForFahim00000000000000000000000000000',
    'SUPERVISOR'
),


-- Technicians
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Arif Mahmud',
    'arif@techstar.com',
    '01710000301',
    '$2b$10$DemoHashForArif0000000000000000000000000000000',
    'TECHNICIAN'
),

(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Sakib Khan',
    'sakib@techstar.com',
    '01710000302',
    '$2b$10$DemoHashForSakib000000000000000000000000000000',
    'TECHNICIAN'
),

(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'Mehedi Hasan',
    'mehedi@techstar.com',
    '01710000303',
    '$2b$10$DemoHashForMehedi00000000000000000000000000000',
    'TECHNICIAN'
);


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
    3,
    TRUE
);


-- ---------------------------------------------------------
-- 3. SERVICE REQUESTS
-- ---------------------------------------------------------

INSERT INTO service_requests (
    customer_id,
    technician_id,
    created_by,
    device_info,
    problem_description,
    priority,
    status,
    progress,
    expected_delivery_at,
    completed_at
)
VALUES

-- Request 1: Repairing
(
    '11111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',

    'Type: Laptop
Brand: Dell
Model: Inspiron 15 3520
Serial Number: DELL-RAHIM-001
RAM: 16GB
Storage: 512GB SSD',

    'Laptop is overheating and shutting down randomly.',

    'HIGH',
    'REPAIRING',
    65,

    NOW() + INTERVAL '2 days',
    NULL
),


-- Request 2: Waiting for parts
(
    '22222222-2222-2222-2222-222222222222',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',

    'Type: Laptop
Brand: HP
Model: Pavilion 15
Serial Number: HP-NUSRAT-002
RAM: 8GB
Storage: 256GB SSD',

    'Laptop keyboard is not working properly. Several keys are unresponsive.',

    'NORMAL',
    'WAITING_FOR_PARTS',
    45,

    NOW() + INTERVAL '4 days',
    NULL
),


-- Request 3: Ready for delivery
(
    '33333333-3333-3333-3333-333333333333',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',

    'Type: Desktop
Brand: ASUS
Model: ExpertCenter D5
Serial Number: ASUS-TANVIR-003
RAM: 16GB
Storage: 1TB HDD',

    'Desktop does not turn on. Power supply unit appears to be faulty.',

    'URGENT',
    'READY_FOR_DELIVERY',
    100,

    NOW() + INTERVAL '1 day',
    NULL
),


-- Request 4: Received
(
    '44444444-4444-4444-4444-444444444444',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',

    'Type: Laptop
Brand: Lenovo
Model: IdeaPad 3
Serial Number: LEN-SADIA-004
RAM: 8GB
Storage: 512GB SSD',

    'Laptop screen is flickering and sometimes becomes completely black.',

    'NORMAL',
    'RECEIVED',
    0,

    NOW() + INTERVAL '5 days',
    NULL
),


-- Request 5: Assigned
(
    '11111111-1111-1111-1111-111111111111',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',

    'Type: Printer
Brand: HP
Model: LaserJet Pro M404dn
Serial Number: HP-RAHIM-005',

    'Printer is producing faded prints and paper jams frequently.',

    'HIGH',
    'ASSIGNED',
    10,

    NOW() + INTERVAL '3 days',
    NULL
),


-- Request 6: Completed
(
    '22222222-2222-2222-2222-222222222222',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',

    'Type: Laptop
Brand: Acer
Model: Aspire 5
Serial Number: ACER-NUSRAT-006
RAM: 8GB
Storage: 512GB SSD',

    'Laptop was running very slowly and frequently freezing.',

    'NORMAL',
    'COMPLETED',
    100,

    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),


-- Request 7: Failed
(
    '33333333-3333-3333-3333-333333333333',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',

    'Type: Router
Brand: TP-Link
Model: Archer C6
Serial Number: TP-TANVIR-007',

    'Router repeatedly disconnects from the internet.',

    'HIGH',
    'FAILED',
    30,

    NOW() - INTERVAL '1 day',
    NULL
),


-- Request 8: Cancelled
(
    '44444444-4444-4444-4444-444444444444',
    NULL,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',

    'Type: Desktop
Brand: HP
Model: ProDesk 400
Serial Number: HP-SADIA-008',

    'Customer requested repair but later cancelled the service.',

    'NORMAL',
    'CANCELLED',
    0,

    NULL,
    NULL
);


-- ---------------------------------------------------------
-- 4. UPDATE TECHNICIAN ACTIVE JOB COUNTS
-- ---------------------------------------------------------

UPDATE technicians
SET active_jobs = 2
WHERE user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

UPDATE technicians
SET active_jobs = 1
WHERE user_id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

UPDATE technicians
SET active_jobs = 2
WHERE user_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';


-- ---------------------------------------------------------
-- 5. EXTRA HISTORY
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
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'RECEIVED',
    'ASSIGNED',
    0,
    0,
    'Request assigned to technician Arif Mahmud'
),

(
    1,
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'ASSIGNED',
    'REPAIRING',
    0,
    20,
    'Technician started diagnosis and repair'
),

(
    1,
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'REPAIRING',
    'REPAIRING',
    20,
    65,
    'Cooling system cleaned and thermal paste replaced'
),


(
    2,
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'RECEIVED',
    'ASSIGNED',
    0,
    0,
    'Request assigned to technician Mehedi Hasan'
),

(
    2,
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'ASSIGNED',
    'REPAIRING',
    0,
    25,
    'Keyboard diagnosed as defective'
),

(
    2,
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'REPAIRING',
    'WAITING_FOR_PARTS',
    25,
    45,
    'Replacement keyboard ordered'
),


(
    3,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'RECEIVED',
    'ASSIGNED',
    0,
    0,
    'Request assigned to technician Arif Mahmud'
),

(
    3,
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'ASSIGNED',
    'REPAIRING',
    0,
    50,
    'Power supply diagnosed as faulty'
),

(
    3,
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'REPAIRING',
    'READY_FOR_DELIVERY',
    50,
    100,
    'Power supply replaced and system tested successfully'
),


(
    6,
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'REPAIRING',
    'COMPLETED',
    80,
    100,
    'Performance issue resolved and final testing completed'
);