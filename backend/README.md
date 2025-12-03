# Geofence Attendance Tracking - Backend API

RESTful API for automatic attendance tracking using GPS geofencing. Built with Node.js, Express, PostgreSQL, and PostGIS.

---

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with PostGIS extension
- **Authentication**: JWT (JSON Web Tokens)
- **Hosting**: Supabase (PostgreSQL + PostGIS)
- **Testing**: Postman

---

## Features

### Implemented
✅ JWT authentication with role-based access control (Admin/Employee)  
✅ Company-scoped data isolation (multi-tenant architecture)  
✅ Geofence CRUD operations (admins only)  
✅ Automatic attendance tracking via GPS coordinates  
✅ State management (no duplicate ENTER/EXIT events)  
✅ Location history tracking  
✅ PostGIS spatial queries for geofence detection  
✅ Seeded test data for development  

### To-Do
⏳ Working hours validation  
⏳ Working days validation (skip weekends)  
⏳ Multiple overlapping geofence priority handling  
⏳ Analytics endpoints (hours worked, attendance reports)  
⏳ Push notifications for attendance events  

---

## Database Schema

```
companies
id (PK)
name
created_at

users
id (PK)
email (unique)
password (bcrypt hashed)
role (admin | employee)
company_id (FK → companies)
is_active
created_at, updated_at

user_profiles
id (PK)
user_id (FK → users, unique)
first_name, last_name
employee_id
department
phone_number

geofences
id (PK)
name, description
location (GEOGRAPHY Point)
radius (meters)
is_active
created_by (FK → users)
company_id (FK → companies)
address
working_hours (JSONB)
working_days (TEXT[])
created_at

attendance
id (PK)
user_id (FK → users)
geofence_id (FK → geofences)
event_type (ENTER | EXIT)
timestamp
location (GEOGRAPHY Point)
is_working_hours, is_working_day
metadata (JSONB)

locations
id (PK)
user_id (FK → users)
location (GEOGRAPHY Point)
timestamp
metadata (JSONB)
```

---

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with PostGIS
- Supabase account (or local PostgreSQL)

### Setup

1. **Clone and install dependencies**:
   ```
   cd backend
   npm install
   ```

2. **Configure environment variables**:
   Create `.env`:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   JWT_SECRET=your-secret-key-change-this
   JWT_EXPIRES_IN=7d
   PORT=5000
   ```

3. **Initialize database**:
   Run the schema in Supabase SQL Editor (see `docs/schema.sql` if you create one)

4. **Seed test data**:
   ```
   npm run seed
   ```

5. **Start server**:
   ```
   npm run dev
   ```

   Server runs at `http://localhost:5000`

---

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login with email/password |
| POST | `/api/auth/register` | Public | Register new user (if enabled) |

### Geofences
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/geofences` | Employee | Get all company geofences |
| GET | `/api/geofences/:id` | Employee | Get geofence by ID |
| POST | `/api/geofences/create` | Admin | Create new geofence |
| PUT | `/api/geofences/:id` | Admin | Update geofence |
| DELETE | `/api/geofences/:id` | Admin | Delete geofence |

### Attendance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/attendance/my` | Employee | Get own attendance history |
| GET | `/api/attendance/company` | Admin | Get all company attendance |
| GET | `/api/attendance/user/:id` | Admin | Get attendance for specific user |

### Locations
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/locations/track` | Employee | Track location & create attendance events |
| GET | `/api/locations/my` | Employee | Get own location history |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users/me` | Employee | Get own profile |
| PUT | `/api/users/me` | Employee | Update own profile |
| GET | `/api/users/company` | Admin | Get all company users |

### Companies
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/companies` | Public | List all companies |
| GET | `/api/companies/:id` | Employee | Get company by ID |

---

## Testing

### Test Credentials (Seeded Data)
**Admin:**
- Email: `admin@techcorp.com`
- Password: `password123`

**Employee 1:**
- Email: `emp1@techcorp.com`
- Password: `password123`

**Employee 2:**
- Email: `emp2@techcorp.com`
- Password: `password123`

### Postman Collection
Import `Capstone - Geofence Attendance API.json` into Postman.

**Test Flow**:
1. Login as employee → Save token
2. Send location inside geofence → Creates ENTER event
3. Send same location again → No duplicate event
4. Send location outside geofence → Creates EXIT event

---

## Core Logic: Attendance Tracking

### Algorithm
```
// When location update received:

Save location to locations table

Query active geofences for user's company using PostGIS ST_DWithin

Get user's last attendance event (by ID DESC)

Apply state machine:

IF inside geofence:
  IF no last event OR last event was EXIT OR last event was for different geofence:
    → Create ENTER event
  ELSE:
    → No action (already inside)

ELSE (outside all geofences):
  IF last event was ENTER:
    → Create EXIT event
  ELSE:
    → No action (already outside)
```

### Key Design Decisions
- **Order by ID, not timestamp**: Prevents seed data from interfering with real events
- **Use first matching geofence**: If multiple overlapping geofences, use first result (can be improved with priority)
- **State validation**: Never create consecutive ENTER or EXIT events for the same geofence

---

## Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── geofenceController.js
│   │   ├── attendanceController.js
│   │   ├── locationController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── geofenceRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── locationRoutes.js
│   │   └── userRoutes.js
│   ├── db/
│   │   └── db.js
│   ├── utils/
│   │   └── authUtils.js
│   ├── seed/
│   │   ├── index.js
│   │   ├── seedCompanies.js
│   │   ├── seedUsers.js
│   │   ├── seedGeofences.js
│   │   ├── seedAttendance.js
│   │   ├── seedLocations.js
│   │   └── clearData.js
│   └── server.js
├── .env
├── package.json
└── README.md
```

---

## Known Issues & Limitations

1. **Seed data timezone**: Seeded attendance uses Indian timezone, can conflict with UTC-based queries
2. **Single geofence selection**: If user is in multiple overlapping geofences, only first is used
3. **No offline support**: API requires active internet connection
4. **Working hours not validated**: Currently all events marked as `is_working_hours: true`
5. **Background tracking**: Mobile app must handle background location updates (backend is stateless)

---

## Future Enhancements

- Add working hours/days validation before creating attendance
- Implement geofence priority for overlapping zones
- Add analytics endpoints (daily/weekly reports)
- Implement graceful handling of force-closed app (detect missing EXIT events)
- Add webhook/push notifications for real-time attendance alerts
- Implement rate limiting to prevent location spam

---

## Contributing

This is a capstone project. For questions, contact [your email].

---

## License

Academic project - not licensed for commercial use.