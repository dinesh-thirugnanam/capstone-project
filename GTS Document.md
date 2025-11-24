# Geofence Attendance Tracking System - Complete Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Technology Stack Deep Dive](#technology-stack-deep-dive)
3. [Database Design](#database-design)
4. [Authentication System](#authentication-system)
5. [Core Features Explained](#core-features-explained)
6. [API Endpoints Details](#api-endpoints-details)
7. [Geofencing Logic](#geofencing-logic)
8. [State Management](#state-management)
9. [Seed Data System](#seed-data-system)
10. [Common Interview Questions](#common-interview-questions)

---

## System Architecture

### High-Level Overview
This is a **RESTful API** built with Node.js and Express that provides automatic attendance tracking using GPS geofencing technology.

**Core Concept**: When an employee enters or exits a defined geographical area (geofence), the system automatically records an attendance event.

### Architecture Pattern
- **Multi-tenant SaaS architecture**: Multiple companies use the same application with isolated data
- **Stateless REST API**: Each request contains all necessary information (JWT token)
- **Role-based access control (RBAC)**: Admin and Employee roles with different permissions

### Request Flow
```
Mobile App → Express Server → JWT Verification → Controller → Database → Response
```

---

## Technology Stack Deep Dive

### Node.js
**Why Node.js?**
- Non-blocking I/O for handling concurrent GPS location updates
- JavaScript ecosystem (same language as frontend)
- Excellent for real-time location tracking applications

### Express.js
**Why Express?**
- Minimalist framework, easy to understand and extend
- Robust routing system
- Middleware support for authentication, logging, etc.

### PostgreSQL with PostGIS
**Why PostgreSQL?**
- Reliable ACID-compliant relational database
- Handles complex queries efficiently

**Why PostGIS?**
- Adds spatial/geographic object support to PostgreSQL
- Essential for geofencing calculations:
  - `ST_SetSRID`: Set coordinate system (we use WGS84 - standard GPS coordinates)
  - `ST_MakePoint`: Create point from longitude/latitude
  - `ST_DWithin`: Check if point is within radius of another point
  - `GEOGRAPHY` type: Calculates distances in meters (not degrees)

### JWT (JSON Web Tokens)
**Why JWT?**
- Stateless authentication (no server-side session storage)
- Contains user info (id, role, company_id) in token payload
- Secure: Signed with secret key, cannot be tampered

**Token Structure**:
```
Header.Payload.Signature
```
Payload contains:
```json
{
  "id": 1,
  "role": "employee",
  "company_id": 1,
  "iat": 1234567890,
  "exp": 1234567890
}
```

### bcryptjs
**Why bcrypt?**
- Industry-standard password hashing
- Salt rounds (12): Makes brute-force attacks computationally expensive
- One-way encryption: Original password cannot be retrieved

---

## Database Design

### Multi-Tenancy Strategy
**Company Isolation**: Every user, geofence, and attendance record belongs to a company.

**How it works**:
```sql
-- When admin creates geofence, it's scoped to their company
WHERE company_id = $1

-- Employees can only see their company's data
WHERE u.company_id = $1
```

### Key Tables Explained

#### `companies`
- Root of the data hierarchy
- Simple table: id, name, created_at

#### `users`
- Stores login credentials and role
- `is_active`: Allows disabling users without deletion
- Foreign key to `companies`: Ensures data isolation

#### `user_profiles`
- Separate from `users` for normalization
- Contains display information (first_name, last_name)
- Optional fields: employee_id, department, phone_number

#### `geofences`
- Defines work locations
- `location`: GEOGRAPHY(Point, 4326) - stores lat/lng in WGS84 coordinate system
- `radius`: Circle radius in meters
- `working_hours`: JSONB `{"start": "09:00", "end": "18:00"}`
- `working_days`: TEXT[] array `['Monday', 'Tuesday', ...]`

#### `attendance`
- Records ENTER/EXIT events
- `event_type`: ENUM-like constraint (ENTER | EXIT)
- `is_working_hours`: Boolean flag (currently not validated, to-do item)
- `is_working_day`: Boolean flag (currently not validated)
- `metadata`: JSONB for extensibility (accuracy, GPS source, etc.)

#### `locations`
- Tracks all GPS updates (breadcrumb trail)
- Saved even if no attendance event created
- Useful for debugging and analytics

### PostGIS Concepts

**GEOGRAPHY vs GEOMETRY**:
- GEOGRAPHY: Uses actual earth coordinates, distances in meters
- GEOMETRY: Flat-plane coordinates, faster but less accurate

**SRID 4326 (WGS84)**:
- Standard GPS coordinate system
- Longitude: -180 to 180
- Latitude: -90 to 90

**Spatial Queries**:
```sql
-- Create point from longitude, latitude
ST_SetSRID(ST_MakePoint(77.5638, 13.0871), 4326)

-- Check if within radius (in meters)
ST_DWithin(
  location::geography,
  user_location::geography,
  100  -- 100 meters
)

-- Extract coordinates from GEOGRAPHY
ST_X(location::geometry) AS longitude
ST_Y(location::geometry) AS latitude
```

---

## Authentication System

### Registration Flow ([`register`](src/controllers/authController.js))
1. Check if email already exists
2. Hash password with bcrypt (12 salt rounds)
3. Insert user into database
4. Return user object (no auto-login)

**Important**: No JWT returned on registration (user must login separately)

### Login Flow ([`login`](src/controllers/authController.js))
1. Query user by email
2. Compare submitted password with hashed password using `bcrypt.compare()`
3. If match, generate JWT with payload: `{id, role, company_id}`
4. Return token to client

### Token Usage
**Client side**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Server side** ([`decodeToken`](src/utils/authUtils.js)):
```javascript
const token = req.headers.authorization.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { id, role, company_id }
```

### Authorization Patterns

**Employee access**:
```javascript
const user = decodeToken(req);
if (!user) return res.status(401).json({ message: 'Unauthorized' });
```

**Admin-only access**:
```javascript
const user = decodeToken(req);
if (!user || user.role !== 'admin') {
  return res.status(403).json({ message: 'Admin access required' });
}
```

**Company-scoped queries**:
```javascript
WHERE company_id = ${user.company_id}
```

---

## Core Features Explained

### 1. Geofence Management ([`geofenceControllers.js`](src/controllers/geofenceControllers.js))

#### Create Geofence
**Only admins** can create geofences for their company.

**Request body**:
```json
{
  "name": "Main Office",
  "description": "Headquarters",
  "latitude": 13.087094,
  "longitude": 77.563739,
  "radius": 100,
  "address": "123 MG Road",
  "working_hours": {"start": "09:00", "end": "18:00"},
  "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}
```

**SQL Execution**:
```sql
INSERT INTO geofences 
(name, description, location, radius, created_by, company_id, ...)
VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, ...)
```

**Why ST_MakePoint(longitude, latitude)?**
PostGIS uses (X, Y) = (longitude, latitude) order, opposite of common "lat, lng" convention.

#### Get Company Geofences
Returns all active geofences for the user's company.

**SQL with coordinate extraction**:
```sql
SELECT 
  id, name, radius,
  ST_X(location::geometry) AS longitude,
  ST_Y(location::geometry) AS latitude
FROM geofences
WHERE company_id = $1 AND is_active = true
```

**Why cast to geometry?**
`ST_X()` and `ST_Y()` only work on GEOMETRY type, not GEOGRAPHY.

#### Delete Geofence
**Validation steps**:
1. Check if geofence exists
2. Verify it belongs to admin's company (prevent cross-company deletion)
3. Hard delete (could be soft delete with `is_active = false`)

---

### 2. Location Tracking ([`locationController.js`](src/controllers/locationController.js))

This is the **core feature** of the application.

#### Track Location Flow ([`trackLocation`](src/controllers/locationController.js))

**Step 1: Save Location** (Always happens)
```sql
INSERT INTO locations (user_id, location, timestamp, metadata)
VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), now(), $4)
```
Even if no attendance event is created, we store the GPS ping.

**Step 2: Check Geofences**
```sql
SELECT * FROM geofences 
WHERE company_id = $1 
  AND is_active = true
  AND ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
    radius
  )
```
**What this does**:
- Finds all active geofences for the user's company
- Checks if user's current location is within the geofence radius
- `ST_DWithin(A, B, distance)` returns true if A is within `distance` meters of B

**Step 3: Get Last Event** (Critical for state management)
```sql
SELECT event_type, geofence_id, timestamp 
FROM attendance 
WHERE user_id = $1 
ORDER BY id DESC  -- NOT timestamp!
LIMIT 1
```
**Why order by `id` not `timestamp`?**
Seed data has old timestamps. Using `id DESC` ensures we get the most recently *inserted* event.

**Step 4: Validate Working Hours/Days** (To-Do)
Currently hardcoded as `true`, but should check:
```javascript
const { start, end } = geofence.working_hours;
const currentTime = now.getHours() * 60 + now.getMinutes();
const startTime = startHour * 60 + startMin;
isWorkingHours = currentTime >= startTime && currentTime <= endTime;
```

**Step 5: State Machine Logic**
```javascript
if (insideGeofences.length > 0) {
  const shouldCreateEnter = 
    !lastEvent ||                              // First event ever
    lastEvent.event_type === 'EXIT' ||         // Was outside, now inside
    lastEvent.geofence_id !== currentGeofence.id;  // Switched geofences

  if (shouldCreateEnter && isWorkingHours && isWorkingDay) {
    // Create ENTER event
  }
} else {
  // Outside all geofences
  if (lastEvent && lastEvent.event_type === 'ENTER') {
    // Create EXIT event (even outside working hours)
  }
}
```

**Why allow EXIT outside working hours?**
If employee leaves after work ends, we still need to close the attendance session.

**Response Structure**:
```json
{
  "locationSaved": true,
  "attendanceEvent": {
    "id": 123,
    "event_type": "ENTER",
    "timestamp": "2024-01-15T09:15:00Z"
  },
  "insideGeofences": ["Main Office"],
  "isWorkingHours": true,
  "isWorkingDay": true,
  "reason": null
}
```

---

### 3. Attendance Queries ([`attendanceControllers.js`](src/controllers/attendanceControllers.js))

#### Get My Attendance ([`getMyAttendance`](src/controllers/attendanceControllers.js))
Employee views their own attendance history.

```sql
SELECT 
  id, event_type, timestamp, 
  is_working_day, is_working_hours,
  ST_X(location::geometry) AS longitude,
  ST_Y(location::geometry) AS latitude
FROM attendance
WHERE user_id = $1
ORDER BY timestamp DESC
LIMIT 50
```

#### Get Company Attendance ([`getCompanyAttendance`](src/controllers/attendanceControllers.js))
Admin views all employees' attendance.

**Complex JOIN**:
```sql
SELECT 
  a.id, a.event_type, a.timestamp,
  u.email,
  up.first_name, up.last_name,
  g.name as geofence_name,
  ST_X(a.location::geometry) as longitude,
  ST_Y(a.location::geometry) as latitude
FROM attendance a
JOIN users u ON a.user_id = u.id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN geofences g ON a.geofence_id = g.id
WHERE u.company_id = $1
ORDER BY a.timestamp DESC
```

**Why LEFT JOIN for profiles/geofences?**
- Profile might not exist yet
- Geofence might have been deleted

#### Get User Attendance ([`getUserAttendance`](src/controllers/attendanceControllers.js))
Admin views specific employee's attendance.

**Security check**:
```javascript
// Verify user belongs to same company
const userCheck = await query(
  'SELECT company_id FROM users WHERE id = $1',
  [id]
);

if (userCheck.rows[0].company_id !== user.company_id) {
  return res.status(403).json({ message: 'Cannot view another company' });
}
```

---

### 4. User Management ([`userControllers.js`](src/controllers/userControllers.js))

#### Get Company Users ([`getCompanyUsers`](src/controllers/userControllers.js))
Admin lists all employees.

```sql
SELECT 
  u.id, u.email, u.role, u.is_active,
  up.first_name, up.last_name, up.employee_id, up.department
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.company_id = $1
ORDER BY u.created_at DESC
```

#### Update Profile ([`updateMyProfile`](src/controllers/userControllers.js))
User updates their own profile.

**Only updates profile table** (not email/password):
```sql
UPDATE user_profiles 
SET first_name = $1, last_name = $2, phone_number = $3
WHERE user_id = $4
```

---

## Geofencing Logic

### How Geofencing Works

**Mathematical Concept**:
A geofence is a circle defined by:
- Center point: (latitude, longitude)
- Radius: distance in meters

**Detection**: Check if user's GPS coordinate is within the circle.

### PostGIS Implementation

**Distance Calculation**:
PostGIS uses the **Haversine formula** internally to calculate great-circle distance on a sphere (Earth).

```sql
ST_DWithin(
  geofence_location::geography,
  user_location::geography,
  radius_in_meters
)
```

**Example**:
```
Geofence: (13.087094, 77.563739), radius 100m
User at: (13.087150, 77.563800)

Distance = ~50 meters
Result: Inside geofence
```

### Edge Cases Handled

1. **User in multiple geofences**: Use first match (could add priority field)
2. **Rapid entry/exit**: State machine prevents duplicate events
3. **GPS inaccuracy**: Metadata stores accuracy value for debugging

### Not Handled (To-Do)

1. **Timezone issues**: All timestamps in UTC, frontend must convert
2. **Offline tracking**: Mobile app must queue locations and sync later
3. **Battery optimization**: Mobile app must use geofencing APIs, not constant polling

---

## State Management

### The Problem
Without state tracking, every GPS update would create a new attendance event:
```
9:00 AM - ENTER
9:01 AM - ENTER (duplicate!)
9:02 AM - ENTER (duplicate!)
```

### The Solution
Store last event type and geofence in database, check before creating new event.

### State Transition Diagram
```
NULL → ENTER (first time inside)
ENTER → ENTER (switched geofences)
ENTER → EXIT (left geofence)
EXIT → ENTER (re-entered)
EXIT → EXIT (invalid, prevented)
```

### Code Implementation
```javascript
const lastEvent = await query(
  'SELECT event_type, geofence_id FROM attendance WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
  [userId]
);

if (!lastEvent || lastEvent.event_type === 'EXIT') {
  // Can create ENTER
} else if (lastEvent.event_type === 'ENTER') {
  // Already inside, no action
}
```

### Why Order by ID?
**Problem**: Seed data has old timestamps (yesterday, last week).
**Solution**: Use `id DESC` to get most recently *inserted* row, not oldest timestamp.

**Example**:
```
id=1, timestamp='2024-01-10 09:00', type=ENTER (seed data)
id=2, timestamp='2024-01-15 09:00', type=ENTER (real event)

ORDER BY timestamp DESC → returns id=2 ✓
ORDER BY id DESC → returns id=2 ✓

But if new seed data added:
id=3, timestamp='2024-01-09 09:00', type=EXIT (seed data)

ORDER BY timestamp DESC → returns id=2 (wrong if id=3 just inserted)
ORDER BY id DESC → returns id=3 ✓
```

---

## Seed Data System

### Purpose
Populate database with realistic test data for development/testing.

### Execution Order ([`src/seed/index.js`](src/seed/index.js))
```
1. seedCompanies    (creates: Tech Corp, Design Studios, Retail Solutions)
2. seedUsers        (creates: admins and employees with bcrypt passwords)
3. seedGeofences    (creates: office locations with working hours)
4. seedAttendance   (creates: ENTER/EXIT events for last 5 days)
5. seedLocations    (creates: GPS breadcrumb trail)
```

**Why this order?**
Foreign key constraints require parent records to exist first:
```
companies → users → geofences → attendance
                  ↓
              locations
```

### Key Seeding Techniques

#### Companies ([`seedCompanies.js`](src/seed/seedCompanies.js))
```javascript
const companies = [
  { name: 'Tech Corp' },
  { name: 'Design Studios Inc' }
];

for (const company of companies) {
  await query(
    'INSERT INTO companies (name) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id, name',
    [company.name]
  );
}
```
**`ON CONFLICT DO NOTHING`**: Prevents errors if running seed multiple times.

#### Users ([`seedUsers.js`](src/seed/seedUsers.js))
```javascript
const hashedPassword = await hash('password123', 12);

// Create user
const userResult = await query(
  'INSERT INTO users (email, password, role, company_id) VALUES ($1, $2, $3, $4) RETURNING id',
  [email, hashedPassword, role, companyId]
);

// Create profile
await query(
  'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3)',
  [userResult.rows[0].id, firstName, lastName]
);
```

#### Geofences ([`seedGeofences.js`](src/seed/seedGeofences.js))
```javascript
const geofences = [
  {
    name: 'Main Office - Tech Corp',
    latitude: 13.087094,
    longitude: 77.563739,
    radius: 100,
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  }
];

await query(
  `INSERT INTO geofences 
   (name, location, radius, working_hours, working_days, created_by, company_id)
   VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7, $8)`,
  [name, longitude, latitude, radius, JSON.stringify(workingHours), workingDays, adminId, companyId]
);
```

#### Attendance ([`seedAttendance.js`](src/seed/seedAttendance.js))
**Realistic pattern**: Generate ENTER at 9 AM, EXIT at 6 PM for last 5 days.

```javascript
for (let day = 0; day < 5; day++) {
  const entryTime = new Date();
  entryTime.setDate(entryTime.getDate() - day);
  entryTime.setHours(9, Math.floor(Math.random() * 30), 0, 0);

  const exitTime = new Date(entryTime);
  exitTime.setHours(18, Math.floor(Math.random() * 60), 0, 0);

  // Create ENTER event
  // Create EXIT event
}
```

#### Locations ([`seedLocations.js`](src/seed/seedLocations.js))
**Create GPS trail**: 20 location points near each geofence, spaced 3 minutes apart.

```javascript
for (let i = 0; i < 20; i++) {
  const timestamp = new Date(now.getTime() - (i * 3 * 60 * 1000));
  
  await query(
    `INSERT INTO locations (user_id, location, timestamp, metadata)
     VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)`,
    [
      userId,
      geofence.longitude + (Math.random() - 0.5) * 0.002,  // Small random offset
      geofence.latitude + (Math.random() - 0.5) * 0.002,
      timestamp,
      JSON.stringify({ accuracy: 10, source: 'seed_script' })
    ]
  );
}
```

**Random offset**: `(Math.random() - 0.5) * 0.002` creates slight variations (~200m) around geofence center.

### Clear Data ([`clearData.js`](src/seed/clearData.js))
**Order matters** (reverse of foreign key dependencies):
```javascript
await query('DELETE FROM attendance');
await query('DELETE FROM locations');
await query('DELETE FROM geofences');
await query('DELETE FROM user_profiles');
await query('DELETE FROM users');
await query('DELETE FROM companies');
```

---

## Common Interview Questions

### 1. **Explain the overall architecture**
> "This is a multi-tenant REST API for geofence-based attendance tracking. Companies create geofences (office locations), and when employees enter/exit these areas, the system automatically logs attendance. It uses PostgreSQL with PostGIS for spatial calculations, JWT for authentication, and implements role-based access control with Admin and Employee roles."

### 2. **How does geofencing work?**
> "A geofence is a virtual circle defined by a center point (latitude/longitude) and radius in meters. When the mobile app sends the employee's GPS coordinates, we use PostGIS's `ST_DWithin` function to check if that point is within the geofence's radius. PostGIS uses the Haversine formula to calculate distances on Earth's curved surface accurately."

### 3. **How do you prevent duplicate attendance events?**
> "We implement a state machine. Before creating a new ENTER event, we query the last attendance event for that user using `ORDER BY id DESC LIMIT 1`. If the last event was already ENTER for the same geofence, we skip creating a duplicate. We only create ENTER if the last event was EXIT or NULL (first time), and vice versa."

### 4. **Why use JWT instead of sessions?**
> "JWT enables stateless authentication, which is crucial for scalability. Each token contains the user's ID, role, and company_id, so we don't need to query the database or maintain server-side session storage for every request. This makes the API horizontally scalable across multiple servers."

### 5. **Explain the database schema relationships**
> "The schema has a hierarchical structure: Companies → Users → Geofences/Attendance/Locations. Every user belongs to a company (company_id foreign key), ensuring data isolation. Geofences are created by admins and scoped to companies. Attendance records link users to geofences with ENTER/EXIT events. Locations store raw GPS data for analytics."

### 6. **How do you handle multi-tenancy?**
> "Every query includes a `WHERE company_id = $1` clause using the company_id from the JWT token. This ensures users can only access data from their own company. For example, when fetching geofences, we only return geofences where `company_id` matches the logged-in user's company."

### 7. **What's the difference between GEOGRAPHY and GEOMETRY in PostGIS?**
> "GEOGRAPHY treats Earth as a sphere and calculates distances in meters using geodetic algorithms (Haversine formula). GEOMETRY treats coordinates as points on a flat plane, which is faster but less accurate over long distances. We use GEOGRAPHY for geofence detection to ensure accurate radius calculations."

### 8. **How would you optimize location tracking for battery life?**
> "On the mobile app side, use geofencing APIs (iOS CLRegion, Android Geofencing API) which use hardware-level detection instead of constant GPS polling. Only send location updates when entering/exiting geofences or at intervals (e.g., every 5 minutes). The backend is already optimized—we batch-insert locations and use spatial indexes on the `location` column."

### 9. **Explain your seed data strategy**
> "Seed data follows the foreign key dependency order: companies → users → geofences → attendance → locations. We use `ON CONFLICT DO NOTHING` to make seeds idempotent (runnable multiple times). Passwords are bcrypt-hashed even in seed data. We generate realistic patterns like ENTER at 9 AM, EXIT at 6 PM for the last 5 days."

### 10. **How would you implement working hours validation?**
> "Currently, `is_working_hours` is hardcoded as true. To implement it, I'd:
> 1. Parse `working_hours` from geofence JSONB: `{start: '09:00', end: '18:00'}`
> 2. Convert current time and working hours to minutes since midnight
> 3. Check if `currentTime >= startTime && currentTime <= endTime`
> 4. Only create attendance events if true (except EXIT, which should always be logged)"

### 11. **What security measures are in place?**
> - **Password hashing**: bcrypt with 12 salt rounds
> - **JWT signing**: HMAC-SHA256 with secret key
> - **SQL injection prevention**: Parameterized queries (`$1, $2`)
> - **Authorization checks**: JWT verification + role checks
> - **Data isolation**: Company-scoped queries
> - **HTTPS**: Required in production (Supabase enforces SSL)

### 12. **How would you handle offline tracking?**
> "The mobile app would queue location updates locally (SQLite/Realm) when offline. When connection resumes, batch-send all queued locations to the API. The backend would process them in chronological order, checking for missing EXIT events (if app was force-closed) and creating them retroactively with the last known location."

### 13. **Explain the `decodeToken` utility**
> "It's a centralized helper in [`authUtils.js`](src/utils/authUtils.js) that extracts and verifies the JWT from the `Authorization: Bearer <token>` header. It returns the decoded payload (id, role, company_id) if valid, or null if missing/invalid/expired. This keeps authentication logic DRY across all controllers."

### 14. **Why separate `users` and `user_profiles` tables?**
> "Database normalization. The `users` table contains authentication data (email, password, role) which rarely changes and is queried frequently for login. The `user_profiles` table has display information (first_name, last_name, phone_number) which may be updated often and isn't needed for auth. This separation also allows for optional profiles."

### 15. **How would you add analytics (e.g., hours worked per day)?**
> "Create a new endpoint `/api/analytics/hours-worked`. Query:
> ```sql
> SELECT 
>   DATE(timestamp) as date,
>   SUM(
>     CASE WHEN event_type = 'EXIT' 
>     THEN EXTRACT(EPOCH FROM (timestamp - lag_timestamp)) / 3600 
>     END
>   ) as hours_worked
> FROM (
>   SELECT 
>     timestamp,
>     event_type,
>     LAG(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) as lag_timestamp
>   FROM attendance
>   WHERE user_id = $1
> ) subquery
> GROUP BY DATE(timestamp);
> ```
> This uses window functions to pair ENTER/EXIT events and calculate time differences."

---

## Code Walkthroughs

### Complete Request Flow Example

**Scenario**: Employee sends location update at 9:15 AM inside office geofence.

**1. HTTP Request**:
```
POST /api/locations/track
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "latitude": 13.087150,
  "longitude": 77.563800,
  "accuracy": 10
}
```

**2. Express Routing** ([`server.js`](server.js)):
```javascript
app.use('/api/locations', locationRoutes);
```

**3. Route Handler** ([`locationRoutes.js`](src/routes/locationRoutes.js)):
```javascript
router.post('/track', trackLocation);
```

**4. Controller** ([`trackLocation`](src/controllers/locationController.js)):

**Step 4a: Decode JWT**
```javascript
const user = decodeToken(req);  // Returns { id: 5, role: 'employee', company_id: 1 }
if (!user) return res.status(401).json({ message: 'Unauthorized' });
```

**Step 4b: Save Location**
```javascript
await query(
  `INSERT INTO locations (user_id, location, timestamp, metadata)
   VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), now(), $4)`,
  [user.id, longitude, latitude, JSON.stringify({ accuracy })]
);
```

**Step 4c: Check Geofences**
```javascript
const geofencesResult = await query(
  `SELECT id, name, radius FROM geofences 
   WHERE company_id = $1 AND is_active = true
   AND ST_DWithin(
     location::geography,
     ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
     radius
   )`,
  [user.company_id, longitude, latitude]
);
// Returns: [{ id: 3, name: 'Main Office', radius: 100 }]
```

**Step 4d: Get Last Event**
```javascript
const lastEventResult = await query(
  `SELECT event_type, geofence_id FROM attendance 
   WHERE user_id = $1 ORDER BY id DESC LIMIT 1`,
  [user.id]
);
// Returns: { event_type: 'EXIT', geofence_id: 3 } (left yesterday)
```

**Step 4e: Decision Logic**
```javascript
if (insideGeofences.length > 0) {  // true
  const shouldCreateEnter = 
    !lastEvent ||                          // false
    lastEvent.event_type === 'EXIT' ||     // true ✓
    lastEvent.geofence_id !== currentGeofence.id;  // false

  if (shouldCreateEnter) {  // true
    await query(
      `INSERT INTO attendance 
       (user_id, geofence_id, event_type, timestamp, location, ...)
       VALUES ($1, $2, 'ENTER', now(), ST_SetSRID(ST_MakePoint($3, $4), 4326), ...)`,
      [user.id, geofence.id, longitude, latitude, ...]
    );
  }
}
```

**Step 4f: Response**
```javascript
res.status(200).json({
  locationSaved: true,
  attendanceEvent: { id: 456, event_type: 'ENTER', timestamp: '2024-01-15T09:15:00Z' },
  insideGeofences: ['Main Office'],
  isWorkingHours: true,
  isWorkingDay: true
});
```

---

## Environment Variables Explained

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```
- Connection string for PostgreSQL
- Supabase format: `pooler.supabase.com` (connection pooler for high concurrency)

```env
JWT_SECRET=your-secret-key
```
- Secret key for signing/verifying JWT tokens
- **Never commit to Git!** Use strong random string in production

```env
JWT_EXPIRES_IN=7d
```
- Token expiration time
- `7d` = 7 days, could also be `1h`, `30m`, etc.

```env
PORT=5000
```
- Server listening port
- Optional (defaults to 5000 if not set)

---

## Production Considerations

### What's Missing for Production

1. **Input Validation**
   - Add schema validation library (Joi, Yup)
   - Validate all request bodies before processing

2. **Rate Limiting**
   - Prevent location spam attacks
   - Use `express-rate-limit` middleware

3. **Logging**
   - Replace `console.log` with Winston/Bunyan
   - Log to files/external service

4. **Error Handling**
   - Global error handler middleware
   - Standardized error responses

5. **Testing**
   - Unit tests (Jest) for controllers
   - Integration tests for API endpoints
   - Load testing for concurrent location updates

6. **Monitoring**
   - Application Performance Monitoring (APM)
   - Database query performance tracking

7. **Documentation**
   - OpenAPI/Swagger specification
   - Postman collection with examples

8. **Security Headers**
   - Helmet.js middleware
   - CORS configuration

---

## Debugging Tips

### Common Issues

**1. "Cannot read property 'id' of undefined"**
```javascript
const user = decodeToken(req);
// user is null if token invalid
```
**Fix**: Add null check before accessing properties.

**2. "SRID not found"**
```sql
ST_SetSRID(ST_MakePoint(77.5, 13.0), 4326)
```
**Fix**: Ensure PostGIS extension is installed in database.

**3. "No geofences detected" despite being inside**
```javascript
// Check if longitude/latitude are swapped
ST_MakePoint(longitude, latitude)  // Correct
ST_MakePoint(latitude, longitude)  // Wrong!
```

**4. Seed data conflicts**
```
ERROR: duplicate key value violates unique constraint "users_email_key"
```
**Fix**: Run `npm run seed:clear` before seeding again.

**5. Wrong last event returned**
```sql
-- If using timestamp instead of id
ORDER BY timestamp DESC  -- Wrong if adding old seed data
ORDER BY id DESC         -- Correct
```

---

This documentation should give your friend a comprehensive understanding of every technical aspect of the project. Key points to emphasize in an interview:

1. **Architecture decisions** (why REST, why JWT, why PostGIS)
2. **Geofencing algorithm** (PostGIS spatial queries)
3. **State management** (preventing duplicate events)
4. **Security** (bcrypt, JWT, SQL injection prevention)
5. **Database design** (normalization, foreign keys, multi-tenancy)

Good luck with the interview!