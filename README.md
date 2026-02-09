# FleetSync Pro

Enterprise Fleet Management Platform for Australian Rideshare Operators (Uber/DiDi).

## Quick Start

### Prerequisites
- Node.js 18+
- Docker Desktop (for PostgreSQL)

### Setup

1. **Start PostgreSQL with Docker:**
```bash
npm run db:up
```

2. **Install dependencies:**
```bash
npm install
cd server && npm install
cd ../client && npm install
```

3. **Setup database:**
```bash
cd server
npx prisma generate
npx prisma db push
npm run db:seed
```

4. **Start development:**
```bash
# From root directory
npm run dev
```

Or start separately:
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

## Default Credentials

- **Email:** admin@fleetsync.com.au
- **Password:** admin123

## API Endpoints

- **Health:** GET /health
- **Auth:** POST /api/auth/login, POST /api/auth/register
- **Vehicles:** /api/vehicles (CRUD)
- **Drivers:** /api/drivers (CRUD)
- **Rentals:** /api/rentals
- **Invoices:** /api/invoices
- **Onboarding:** /api/onboarding
- **Compliance:** /api/compliance
- **Analytics:** /api/analytics

## Australian Compliance

- **VEVO Check:** Passport numbers ending in '0000' are auto-DENIED
- **NSW Dates:** rego_expiry, ctp_expiry (Green Slip), pink_slip_expiry (Safety)
- **Billing:** (Weekly_Rate + Tolls + Fines) - Credits
