# TechStar Frontend - React Application

React, Vite, and Tailwind CSS web application for the TechStar Electronics Repair Workshop Management System.

---

## Running Steps

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside the `frontend/` directory. Copy the variables from the provided `.env.example` file into the new `.env` file and set each variable to its appropriate value.

### 3. Start Development Server
```bash
# Start Vite development server with hot-module replacement (HMR)
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### 4. Build for Production
```bash
# Compile Tailwind CSS and bundle JS assets
npm run build

# Preview production build locally
npm run preview
```

---

## Directory Structure

```text
frontend/
├── public/                     # Public static assets
├── src/
│   ├── assets/                 # Image assets and graphics
│   ├── components/             # Reusable UI components
│   │   ├── auth/               # Route security & role authorization (`ProtectedRoute.jsx`)
│   │   ├── common/             # Built-in UI elements (Dropdown, SelectField, ConfirmModal, etc)
│   │   ├── layout/             # Application headers, sidebar navigation & layouts 
│   │   ├── serviceRequest/     # Ticket cards, status badges, details modals & printable receipts 
│   │   └── supervisor/         # Executive overview cards, status charts & staff management modals
│   ├── context/                # React Context state providers (AuthContext, PeriodContext)
│   ├── pages/                  # Page route views & role-based dashboard pages
│   │   ├── auth/               # Access denied & unauthorized error views
│   │   ├── chat/               # Staff group chat communication interface
│   │   ├── customer/           # Public repair status tracking portal (TrackingPage)
│   │   ├── operator/           # Operator workspace (Dashboard, ServiceRequests, NewRequestPage)
│   │   ├── supervisor/         # Supervisor workspace (Dashboard, StaffPage, Logs)
│   │   ├── Home.jsx            # System landing page & portal selector
│   │   └── Login.jsx           # Staff authentication login page
│   ├── services/               # API client wrappers (api.js, serviceRequest.api.js, supervisor.api.js, etc.)
│   ├── sockets/                # Socket.IO connection client (socket.js) & event handlers (serviceRequest.socket.js)
│   ├── App.jsx                 # Top-level React Router definitions & context providers
│   ├── index.css               # Global styles & Tailwind CSS configuration
│   └── main.jsx                # React application entry point
├── .env-example                # Template for frontend environment variables
├── index.html                  # HTML5 application template
├── package.json                # Project dependencies & scripts (`dev`, `build`, `preview`)
└── vite.config.js              # Vite bundler configuration
```
