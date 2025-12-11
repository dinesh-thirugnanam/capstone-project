# Geofence Attendance Tracking System

A mobile application for automatic attendance tracking using GPS geofencing technology. Built with React Native (Expo) and Node.js.

---

## Project Overview

This system automatically tracks employee attendance by detecting when they enter or exit designated geofenced areas. The mobile app continuously monitors GPS location in the background and communicates with the backend API to log attendance events.

**Key Features:**
- Automatic attendance tracking via GPS geofencing
- Real-time location monitoring with background support
- Role-based access control (Admin/Employee)
- Multi-tenant architecture (company-scoped data)
- PostGIS spatial queries for accurate geofence detection
- JWT authentication

---

## Repository Structure

```
capstone-project/
├── frontend/          # React Native mobile app (Expo)
├── backend/           # Node.js REST API
└── documents/         # Project documentation (for evaluators)
```

### `/frontend` - Mobile Application
React Native mobile app built with Expo for cross-platform support (iOS/Android).

**Tech Stack:**
- React Native with Expo
- React Navigation for routing
- Expo Location & Task Manager for background tracking
- React Native Maps for geofence visualization
- NativeWind (Tailwind CSS) for styling
- Axios for API communication

**Key Features:**
- Background location tracking
- Real-time geofence detection
- Interactive map with geofence visualization
- Attendance history view
- User profile management

📖 **For detailed setup and usage instructions, see [frontend/README.md](frontend/README.md)** (if available)

---

### `/backend` - REST API Server
Node.js/Express backend with PostgreSQL + PostGIS for spatial queries.

**Tech Stack:**
- Node.js with Express.js
- PostgreSQL 15+ with PostGIS extension
- JWT authentication
- Supabase hosting

**Key Features:**
- RESTful API endpoints
- Geofence CRUD operations
- Automatic attendance event creation
- Location history tracking
- Company-scoped data isolation
- State management (prevents duplicate events)

📖 **For detailed API documentation, setup instructions, and database schema, see [backend/README.md](backend/README.md)**

---

### `/documents` - Project Documentation
Contains all academic project deliverables for college evaluation purposes.

**Included Documents:**
- Final project report (signed)
- Research paper
- Presentation slides
- Similarity reports
- Signed certificates

> **Note:** This folder is intended for evaluators and contains formal project documentation.

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with PostGIS (or Supabase account)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd capstone-project
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   # Configure .env file (see backend/README.md)
   npm run seed
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   # Update API URL in src/services/api.js
   npm start
   ```

4. **Run the app:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

---

## How It Works

1. **Admin** creates geofences (locations with radius) via the mobile app
2. **Employee** enables location tracking in the app
3. App monitors GPS location in the background
4. When employee enters a geofence → **ENTER** event logged
5. When employee exits a geofence → **EXIT** event logged
6. Attendance records are viewable in the app and via API

**State Management:**
- Prevents duplicate consecutive ENTER/EXIT events
- Handles multiple geofences intelligently
- Tracks location history for audit purposes

---

## Testing

**Test Credentials (Seeded Data):**

Admin:
- Email: `admin@techcorp.com`
- Password: `password123`

Employee:
- Email: `emp1@techcorp.com`
- Password: `password123`

See `backend/README.md` for Postman collection and API testing details.

---

## Architecture

```
Mobile App (React Native)
    ↓ GPS Location Updates
Backend API (Node.js/Express)
    ↓ Spatial Queries
Database (PostgreSQL + PostGIS)
```

**Data Flow:**
1. Mobile app sends GPS coordinates to `/api/locations/track`
2. Backend queries active geofences using PostGIS ST_DWithin
3. Backend determines if ENTER/EXIT event should be created
4. Attendance record saved to database
5. Response sent back to mobile app

---

## Project Status

**Completed:**
✅ Core geofencing logic  
✅ Background location tracking  
✅ JWT authentication  
✅ Multi-tenant architecture  
✅ Mobile app UI  
✅ Admin geofence management  

**Future Enhancements:**
⏳ Working hours validation  
⏳ Analytics dashboard  
⏳ Push notifications  
⏳ Offline support  

---

## License

Academic capstone project - not licensed for commercial use.

---

## Contact

For questions or evaluation inquiries, please contact the project team.
