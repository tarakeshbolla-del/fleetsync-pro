# FleetSync Pro - Test Data Documentation

> **Purpose**: This document provides comprehensive test data scenarios for demonstrating FleetSync Pro's validation logic and business rules. Each scenario includes the expected outcome and explanation.

---

## 📋 Table of Contents
1. [Driver Registration & VEVO Validation](#1-driver-registration--vevo-validation)
2. [Vehicle Compliance & Expiry Checks](#2-vehicle-compliance--expiry-checks)
3. [Rental Management](#3-rental-management)
4. [Invoice Processing](#4-invoice-processing)
5. [Authentication](#5-authentication)

---

## 1. Driver Registration & VEVO Validation

### ✅ PASS Scenarios

| # | Name | Email | License No | Passport No | Expected Result |
|---|------|-------|------------|-------------|-----------------|
| 1 | John Doe | john.doe@email.com | NSW1234567 | PA1234567 | **APPROVED** - Valid passport format |
| 2 | Sarah Wilson | sarah.w@email.com | VIC9876543 | AU9876543 | **APPROVED** - Valid passport format |
| 3 | Michael Brown | m.brown@email.com | QLD5551234 | PA5551234 | **APPROVED** - Valid passport format |
| 4 | Empty Passport | no.passport@email.com | NSW1111111 | *(empty)* | **PENDING** - No passport to verify |

### ❌ FAIL Scenarios

| # | Name | Email | License No | Passport No | Expected Result | Why It Fails |
|---|------|-------|------------|-------------|-----------------|--------------|
| 1 | James Black | j.black@email.com | NSW0001111 | PA990000 | **DENIED → BLOCKED** | Passport ends in `0000` - VEVO check rejects work rights |
| 2 | Anna White | a.white@email.com | QLD7770000 | AU880000 | **DENIED → BLOCKED** | Passport ends in `0000` - simulates visa violation |
| 3 | Bob Test | b.test@email.com | NSW1230000 | XX000000 | **DENIED → BLOCKED** | Passport ends in `0000` - unauthorized work status |
| 4 | Duplicate Email | john.smith@email.com | NSW9999999 | PA9999999 | **ERROR** | Email already exists (john.smith@email.com is seeded) |
| 5 | Duplicate License | new.driver@email.com | NSW1234567 | PA8888888 | **ERROR** | License number already registered |

> **Business Rule**: The VEVO (Visa Entitlement Verification Online) check validates a driver's right to work in Australia. Passports ending in `0000` simulate a failed work rights check.

---

## 2. Vehicle Compliance & Expiry Checks

### ✅ PASS Scenarios (Compliant Vehicles)

| # | Plate | Rego Expiry | CTP Expiry | Pink Slip Expiry | Status |
|---|-------|-------------|------------|------------------|--------|
| 1 | ABC123 | 2026-08-15 | 2026-09-15 | 2026-10-15 | **GREEN** - All documents valid |
| 2 | XYZ789 | 2026-07-01 | 2026-07-01 | 2026-08-01 | **GREEN** - All documents valid |
| 3 | DEF456 | 2026-06-30 | 2026-06-30 | 2026-06-30 | **GREEN** - All identical dates valid |

### ⚠️ AMBER Scenarios (Expiring Within 30 Days)

| # | Plate | Document | Expiry Date | Days Until Expiry | Status |
|---|-------|----------|-------------|-------------------|--------|
| 1 | QRS345 | Rego | 2026-03-07 | ~27 days | **AMBER** - Approaching expiry |
| 2 | WXY901 | Rego | 2026-02-25 | ~17 days | **AMBER** - Renewal needed soon |
| 3 | MNO012 | CTP | 2026-02-20 | ~12 days | **AMBER** - CTP renewal warning |

### ❌ FAIL Scenarios (Expired = Suspended)

| # | Plate | Rego Expiry | CTP Expiry | Pink Slip Expiry | Expected Result | Why It Fails |
|---|-------|-------------|------------|------------------|-----------------|--------------|
| 1 | EXP001 | 2026-01-01 | 2026-03-01 | 2026-03-01 | **SUSPENDED** | Rego expired - vehicle cannot operate |
| 2 | EXP002 | 2026-03-01 | 2026-01-15 | 2026-03-01 | **SUSPENDED** | CTP expired - no insurance coverage |
| 3 | EXP003 | 2026-03-01 | 2026-03-01 | 2025-12-01 | **SUSPENDED** | Pink Slip expired - safety check overdue |
| 4 | EXP004 | 2025-12-01 | 2025-11-01 | 2025-10-01 | **SUSPENDED** | All three documents expired |

> **Business Rule**: Any expired document (Rego, CTP, or Pink Slip) automatically suspends the vehicle. The compliance watchdog runs daily to enforce this.

---

## 3. Rental Management

### ✅ PASS Scenarios

| # | Driver Status | Vehicle Status | Weekly Rate | Bond | Expected Result |
|---|---------------|----------------|-------------|------|-----------------|
| 1 | ACTIVE | AVAILABLE | $500 | $1200 | **RENTAL CREATED** |
| 2 | ACTIVE | AVAILABLE | $450 | $1000 | **RENTAL CREATED** |
| 3 | PENDING_APPROVAL | AVAILABLE | $400 | $900 | **RENTAL CREATED** (pending drivers allowed) |

### ❌ FAIL Scenarios

| # | Driver | Vehicle | Attempting | Expected Result | Why It Fails |
|---|--------|---------|------------|-----------------|--------------|
| 1 | BLOCKED driver | AVAILABLE vehicle | Create rental | **REJECTED** | Driver is blocked (VEVO denied) |
| 2 | ACTIVE driver | RENTED vehicle | Create rental | **REJECTED** | Vehicle already assigned to another driver |
| 3 | ACTIVE driver | SUSPENDED vehicle | Create rental | **REJECTED** | Vehicle has compliance issues |
| 4 | ACTIVE driver | MAINTENANCE vehicle | Create rental | **REJECTED** | Vehicle not available for rental |
| 5 | Non-existent driver | AVAILABLE vehicle | Create rental | **ERROR** | Driver ID not found |
| 6 | ACTIVE driver | Non-existent vehicle | Create rental | **ERROR** | Vehicle ID not found |

> **Business Rule**: Rentals can only be created between active/pending drivers and available vehicles. The system prevents double-booking.

---

## 4. Invoice Processing

### ✅ PASS Scenarios

| # | Invoice Amount | Payment Amount | Expected Result |
|---|----------------|----------------|-----------------|
| 1 | $500.00 | $500.00 | **PAID** - Full payment received |
| 2 | $450.00 | $450.00 | **PAID** - Exact amount |
| 3 | $500.00 | $600.00 | **PAID** - Overpayment creates credit |

### ❌ FAIL Scenarios

| # | Invoice | Action | Expected Result | Why It Fails |
|---|---------|--------|-----------------|--------------|
| 1 | Already PAID | Mark as paid again | **NO CHANGE** | Cannot mark paid invoice as paid |
| 2 | Non-existent ID | Download PDF | **404 ERROR** | Invoice not found |
| 3 | PENDING invoice | Download PDF | **SUCCESS** | This actually works - can download pending invoices |

> **Business Rule**: Invoices are auto-generated weekly based on active rentals. Each invoice captures the weekly rate at the time of generation.

---

## 5. Authentication

### ✅ PASS Scenarios

| # | Email | Password | Role | Expected Result |
|---|-------|----------|------|-----------------|
| 1 | admin@fleetsync.com.au | admin123 | FLEET_MANAGER | **LOGIN SUCCESS** → Dashboard |
| 2 | john.smith@email.com | driver123 | DRIVER | **LOGIN SUCCESS** → Driver Operations |
| 3 | jane.doe@email.com | driver123 | DRIVER | **LOGIN SUCCESS** → Driver Operations |

### ❌ FAIL Scenarios

| # | Email | Password | Expected Result | Why It Fails |
|---|-------|----------|-----------------|--------------|
| 1 | admin@fleetsync.com.au | wrongpass | **401 UNAUTHORIZED** | Incorrect password |
| 2 | nonexistent@email.com | any123 | **401 UNAUTHORIZED** | User does not exist |
| 3 | admin@fleetsync.com.au | *(empty)* | **400 BAD REQUEST** | Password is required |
| 4 | *(empty)* | admin123 | **400 BAD REQUEST** | Email is required |
| 5 | invalid-email | admin123 | **400 BAD REQUEST** | Invalid email format |

---

## 🧪 API Testing Examples

### Test VEVO Check (cURL)

```bash
# PASS: Valid passport
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Driver","email":"test@email.com","licenseNo":"NSW1111111","passportNo":"PA1234567"}'
# Result: vevoStatus = "APPROVED", status = "PENDING_APPROVAL"

# FAIL: Passport ending in 0000
curl -X POST http://localhost:3001/api/drivers \
  -H "Content-Type: application/json" \
  -d '{"name":"Blocked Driver","email":"blocked@email.com","licenseNo":"NSW2222222","passportNo":"PA990000"}'
# Result: vevoStatus = "DENIED", status = "BLOCKED"
```

### Test Vehicle Compliance (cURL)

```bash
# Check all vehicle compliance
curl http://localhost:3001/api/compliance/check

# Get compliance alerts
curl http://localhost:3001/api/compliance/alerts

# Get upcoming expiries (30-day window)
curl http://localhost:3001/api/compliance/upcoming
```

### Test Login (cURL)

```bash
# PASS: Valid admin login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetsync.com.au","password":"admin123"}'
# Result: { user: {...}, token: "jwt..." }

# FAIL: Wrong password
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetsync.com.au","password":"wrongpassword"}'
# Result: { error: "Invalid credentials" }
```

---

## 📊 Summary of Validation Rules

| Domain | Rule | Implementation |
|--------|------|----------------|
| **VEVO** | Passport ending in `0000` = DENIED | `DriverService.checkVevoMock()` |
| **Compliance** | Any expired document = SUSPENDED | `ComplianceService.checkExpiries()` |
| **Compliance** | Expiry within 30 days = AMBER warning | `ComplianceService.getUpcomingExpiries()` |
| **Rentals** | Only AVAILABLE vehicles can be rented | Vehicle status check |
| **Rentals** | BLOCKED drivers cannot rent | Driver status check |
| **Drivers** | Unique email and license required | Prisma unique constraint |
| **Auth** | Valid email + password required | bcrypt password comparison |

---

*Document generated for FleetSync Pro demonstration purposes*
