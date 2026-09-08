# TechStar — Real-Time Electronics Repair Workshop Management System

TechStar is a real-time service management system designed to manage customer service requests, staff operations, service progress, notifications, communication, and service-related activities through a centralized web application.

The system provides dedicated interfaces for **Operators** and **Supervisors**, while customers can track their service requests using a secure access mechanism.

---

## Table of Contents

1. [Features](#features)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Assumptions](#assumptions)
5. [Setup & Installation](#setup--installation)
6. [Build and Run Instructions](#build-and-run-instructions)
7. [Database Setup & Schema](#database-setup--schema)
8. [API Documentation](#api-documentation)
9. [WebSocket Real-Time Events](#websocket-real-time-events)
10. [Background Processing](#background-processing)
11. [Security & Development Guidelines](#security--development-guidelines)

---

## Features

### Service Request Management
* Create and manage repair service requests.
* Record customer details, device specifications, problem description, payment amount, priority, status, and expected delivery date.
* Track real-time progress (`0%` to `100%`) through the repair lifecycle (`RECEIVED`, `ASSIGNED`, `REPAIRING`, `WAITING_FOR_PARTS`, `READY_FOR_DELIVERY`, `COMPLETED`, `FAILED`, `CANCELLED`).
* View complete history and audit logs.
* Print structured service receipts/invoices.

### Customer Tracking Portal
* Customers can track their repair progress without logging.
* Tracking requires the Service Request ID and a secure 6-digit Customer Access Code.
* Provides real-time updates on status, progress, device info, estimated completion time, and payment details.

### Operator Workspace
* Front-desk operators can log new service requests, search customer profiles by phone, and assign technicians.
* Monitor active repairs, filter by status/priority, and search by customer or device.
* Access staff group chat and receive real-time notifications.

### Supervisor Dashboard & Staff User Management
* Executive overview with live KPIs, total revenue, average repair value, and status/priority analytics.
* Interactive period performance filters (**Today**, **This week**, **This month**, **This year**, **All time**, **Custom range**).
* **Staff Account Management**: Supervisors can create and update accounts for **Operators** and **Technicians**, managing technician workload capacities (`max_capacity`), specializations, and availability status.

### Real-Time Staff Group Chat
* Instant Socket.IO communication channel for Operators and Supervisors.
* Displays sender name, role, timestamp, and message content.
* Triggers unread chat signals and notifications for offline or inactive staff.

### Targeted Notifications
* User-specific notifications for **CHAT** and **OVERDUE** repair tickets.
* **Notification Visibility Matrix**:
  | Notification Type | Operator | Supervisor |
  | --- | --- | --- |
  | Chat from another staff member | Yes | Yes |
  | Own chat message | No | No |
  | Overdue request created by operator | Yes | Yes |
  | Overdue request created by another operator | No | Yes |
* Supports read/unread tracking (`user_notification_track`), auto-read on opening the chat page, unread badges, and mark-all-as-read.

---

## Architecture Overview

```text
                         ┌─────────────────────┐
                         │      Customer       │
                         │ Service Tracking    │
                         └──────────┬──────────┘
                                    │
                                    │
┌──────────────────┐                │
│    Operator /    │                │
│    Supervisor    │                │
└────────┬─────────┘                │
         │                          │
         │ HTTP / WebSocket         │
         │                          │
┌────────▼──────────────────────────▼───────┐
│                Backend                    │
│                                           │
│              Express.js API               │
│                                           │
│          ┌─────────────────────┐          │
│          │     Middleware      │          │
│          │  (Auth, CORS, Rate) │          │
│          └──────────┬──────────┘          │
│                     │                     │
│              ┌──────▼──────┐              │
│              │ Controllers │              │
│              └──────┬──────┘              │
│                     │                     │
│              ┌──────▼──────┐              │
│              │  Services   │              │
│              └──────┬──────┘              │
│                     │                     │
│              ┌──────▼──────┐              │
│              │ Repositories│              │
│              └──────┬──────┘              │
│                     │                     │
│  ┌──────────────────▼──────────────────┐  │
│  │            Supabase / PostgreSQL     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌────────────────┐   ┌───────────────┐   │
│  │   Socket.IO    │   │ Graphile      │   │
│  │   Real-Time    │   │ Worker        │   │
│  └────────────────┘   └───────┬───────┘   │
│                               │           │
│                        ┌──────▼────────┐  │
│                        │ Background    │  │
│                        │ Tasks         │  │
│                        └───────────────┘  │
└───────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Real-Time Client**: Socket.IO Client (`socket.io-client`)
- **HTTP Client**: Native Fetch API wrapper (`apiRequest`)

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Real-Time Server**: Socket.IO Server (`socket.io`)
- **Database Client**: `@supabase/supabase-js`
- **Auth & Hashing**: `jsonwebtoken` & `bcryptjs`
- **Background Jobs**: Graphile Worker
- **Email Delivery**: `nodemailer`

### Database
- **Database Engine**: PostgreSQL / Supabase
- **Stored Logic**: SQL Functions, Triggers, RPC Procedures (`get_user_notifications`, `count_unread_user_notifications`, `mark_all_user_notifications_as_read`, `create_overdue_notifications`)

---

## Assumptions

1. **User Roles**: The system assumes that each user is assigned a valid role such as Supervisor, Operator, Technician, or Customer.
2. **Authentication**: The system assumes that users authenticate through the application's authentication mechanism before accessing protected resources.
3. **Database Availability**: The system assumes that the configured Supabase PostgreSQL database is available and accessible by the backend.
4. **Email Configuration**: The system assumes that valid SMTP credentials are configured when email-based background notifications are required.
5. **Unique User Accounts**: The system assumes that each system user has a unique account and associated credentials.

---

## Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL / Supabase Database Account**

### 1. Clone the Repository
```bash
git clone https://github.com/mhr-noyon/TechStar.git
cd TechStar
```

### 2. Backend Environment Setup
Navigate to `backend/` and install dependencies:
```bash
cd backend
npm install
```
Create a `.env` file inside `backend/` and copy the variables from `.env-example` and set values.

### 3. Frontend Environment Setup
Navigate to `frontend/` and install dependencies:
```bash
cd ../frontend
npm install
```
Create a `.env` file inside `frontend/` and copy the variables from `.env-example` and set values.

---

## Build and Run Instructions

### Start Backend Server + Worker
```bash
cd backend
# Development mode with hot reloading
npm run dev

# Production mode
npm start
```

### Start Frontend Client
```bash
cd frontend
# Start Vite development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## Database Setup & Schema

Execute the unified SQL scripts located in `backend/sql/` on your Supabase / PostgreSQL Query Editor:

1. **`sql/schema.sql`**: Creates all ENUM types (`user_role`, `request_status`, `request_priority`, `notifications_type`), tables (`users`, `technicians`, `service_requests`, `service_request_history`, `service_request_emails`, `chat_messages`, `notifications`, `user_notification_track`), indexes, triggers, and stored RPC functions.
2. **`sql/seed.sql`**: Inserts initial demo staff, technicians, service requests, chat history, and notifications.

---

## API Documentation

All API endpoints are prefixed with `/api`. Protected routes require `Bearer <token>` HTTP Authorization header.

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public |
| `POST` | `/api/auth/refresh` | Refresh JWT access token | Public |
| `POST` | `/api/auth/logout` | End user session | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated |

### 🛠️ Service Requests (`/api/service-requests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/service-requests/track` | Track repair status via access code & ID | Public |
| `GET` | `/api/service-requests` | List service requests | Operator / Supervisor |
| `POST` | `/api/service-requests` | Create new repair ticket | Operator / Supervisor |
| `GET` | `/api/service-requests/:id` | Get ticket details | Operator / Supervisor |
| `GET` | `/api/service-requests/:id/history` | Get ticket audit history log | Operator / Supervisor |
| `PATCH` | `/api/service-requests/:id/assign` | Assign technician to ticket | Operator / Supervisor |
| `PATCH` | `/api/service-requests/:id/status` | Update status | Operator / Supervisor |
| `PATCH` | `/api/service-requests/:id/progress` | Update progress percentage | Operator / Supervisor |
| `PATCH` | `/api/service-requests/:id/complete` | Mark service request as completed | Operator / Supervisor |
| `PATCH` | `/api/service-requests/:id/cancel` | Cancel service request | Operator / Supervisor |
| `PATCH` | `/api/service-requests/:id` | Update service request details | Operator / Supervisor |

### 👥 User & Staff Management (`/api/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List system users | Supervisor / Operator |
| `GET` | `/api/users/customers` | Find customer profile by phone number | Supervisor / Operator |
| `POST` | `/api/users/customers` | Create customer account | Supervisor / Operator |
| `POST` | `/api/users/operators` | Create operator account | Supervisor |
| `POST` | `/api/users/technicians` | Create technician user & workload profile | Supervisor |
| `PATCH` | `/api/users/:id` | Update user profile account | Supervisor / Operator |

### 👨‍🔧 Technicians (`/api/technicians`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/technicians` | List all technicians with active job counts | Operator / Supervisor |
| `GET` | `/api/technicians/available` | List available technicians | Operator / Supervisor |
| `GET` | `/api/technicians/:id` | Get technician details | Operator / Supervisor |
| `PATCH` | `/api/technicians/:id` | Update technician capacity, specialization & availability | Supervisor |

### 📊 Supervisor Management (`/api/supervisor`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/supervisor/overview` | Executive overview, revenue & analytics | Supervisor |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/notifications` | Fetch user notifications | Authenticated |
| `GET` | `/api/notifications/unread-count` | Fetch count of unread notifications | Authenticated |
| `PATCH` | `/api/notifications/:id/read` | Mark single notification as read | Authenticated |
| `POST` | `/api/notifications/read-all` | Mark all user notifications as read | Authenticated |

### 💬 Staff Group Chat (`/api/chat`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/chat/messages` | Get recent chat messages | Authenticated |
| `POST` | `/api/chat/messages` | Send chat message to staff group | Authenticated |

---

## WebSocket Real-Time Events

TechStar utilizes Socket.IO for real-time state synchronization across staff clients:

### Client -> Server Events
- `join` (`{ room }`): Join specific room channel (e.g. `serviceRequest:1`).
- `joinUser` (`userId`): Join personal user socket channel (`user:<userId>`).
- `joinRole` (`role`): Join role-based channel (`operators` or `supervisors`).
- `joinServiceRequest` (`serviceRequestId`): Join specific repair ticket room.
- `technician:reservation` (`{ technicianId, requestId, reserved }`): Temporarily reserve or release a technician assignment.
- `chat:send` (`msgData`): Send staff group chat message.

### Server -> Client Events
- `serviceRequest:created`: Emitted when a new request is created (`{ serviceRequest, history }`).
- `serviceRequest:assigned`: Emitted when a technician is assigned to a ticket (`{ serviceRequestId, technicianId, assignedBy, serviceRequest, history }`).
- `serviceRequest:statusUpdated`: Emitted when repair status or progress updates (`{ serviceRequestId, status, updatedBy, serviceRequest, history }`).
- `serviceRequest:historyCreated`: Emitted to staff channels when an audit trail entry is created (`{ history, serviceRequest }`).
- `technician:reservationChanged`: Emitted to operators when a technician reservation changes (`{ technicianId, requestId, reserved, reservationId }`).
- `chat:message`: Emitted to all connected staff when a chat message is sent (`{ id, sender_id, sender_name, sender_role, content, created_at }`).
- `chat:unread`: Emitted to staff rooms for unread chat indicators.
- `notification:new`: Emitted to targeted user room (`user:<userId>`) when a new notification arrives.

---

## Background Processing

Background tasks run via Graphile Worker:
- **Overdue Repair Detector**: Periodically inspects active service requests (`overdue-check`). When a ticket exceeds its `expected_delivery_at`, an `OVERDUE` notification is generated and broadcast to the creator and supervisors.
- **Email Confirmation Worker**: Sends customer confirmation emails when tickets are created or status changes to `READY_FOR_DELIVERY` / `FAILED`.

---

## Security & Development Guidelines

- **Protected API Routes**: Enforced via JWT authentication middleware (`authenticateToken`).
- **Role-Based Access**: Restricted using `authorizeRoles('SUPERVISOR')`.
- **Database Integrity**: Parameterized queries via Supabase client, foreign key relationships, and check constraints.
- **Environment Isolation**: Sensitive credentials and secrets managed strictly via environment variables.