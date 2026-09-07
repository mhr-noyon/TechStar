# TechStar Backend Service

Node.js, Express, and Socket.IO REST API & WebSockets server for the TechStar Electronics Repair Workshop Management System.

---

## Running Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend/` directory. Copy the variables from the provided `.env.example` file into the new `.env` file and set each variable to its appropriate value.

### 3. Run Database Setup
Run the SQL scripts in `backend/sql/` on your Supabase / PostgreSQL query editor:
- `sql/schema.sql` (Creates all tables, enums, indexes, triggers, and RPC stored procedures)
- `sql/seed.sql` (Seeds demo staff, technicians, service requests, and notifications)

### 4. Start the Server + Worker
```bash
# Development mode with hot-reloading
npm run dev

# Production mode
npm start
```

Server runs by default on `http://localhost:5000`.

## Directory Structure

```text
backend/
├── sql/                        # Master database scripts
│   ├── schema.sql              # Full database schema (tables, enums, indexes, triggers & RPC functions)
│   ├── seed.sql                # Initial seed data for demo staff, tickets, and notifications
│   └── migration/              # Versioned SQL migration files
├── src/
│   ├── app.js                  # Express application setup & route mounting
│   ├── server.js               # Main entry point (starts Express, Socket.IO & Graphile Worker)
│   ├── config/                 # Environment variable loader (`env.js`) & Supabase DB client (`database.js`)
│   ├── controllers/            # HTTP request & response handlers
│   ├── middleware/             # JWT authentication (`authenticateToken`) & role authorization (`authorizeRoles`)
│   ├── repositories/           # Supabase PostgreSQL data access abstraction layer
│   ├── routes/                 # Express API routes (`auth`, `users`, `serviceRequests`, `supervisor`, `technicians`, `notifications`, `chat`)
│   ├── services/               # Business logic, audit logging & notification dispatchers
│   ├── sockets/                # Socket.IO connection manager & real-time event emitters
│   ├── tasks/                  # Worker tasks (`overdueCheck.task.js`, `sendServiceRequestEmail.task.js`)
│   └── workers/                # Graphile Worker background job runner & fallback polling scheduler
├── .env-example                # Template for environment configuration
└── package.json                # Project dependencies & scripts (`dev`, `start`)
```
