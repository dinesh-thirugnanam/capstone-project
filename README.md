# Capstone-Project: Real-Time Geospatial Tracking App

## Capstone Backend API

A minimal but functional backend API for a mobile app with geospatial capabilities, built with Node.js, Express, and MongoDB.

## Features

- ✅ User authentication with JWT tokens
- ✅ Location data management with geospatial queries
- ✅ CORS enabled for mobile app integration
- ✅ Input validation and error handling
- ✅ Pagination for location history
- ✅ Find nearby locations within specified radius
- ✅ Health check endpoint for monitoring
- ✅ Structured JSON responses
- ✅ Request logging with Morgan

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Password Hashing**: bcryptjs
- **Logging**: Morgan
- **CORS**: cors middleware

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone and navigate to the project**
   ```bash
   git clone <repository-url>
   cd capstone-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the `.env` file and update the values:
   ```bash
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/capstone-app
   JWT_SECRET=your_super_secure_jwt_secret_key_here_change_in_production
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system or update `MONGODB_URI` to point to your MongoDB cloud instance.

5. **Run the application**
   
   For development (with auto-restart):
   ```bash
   npm run dev
   ```
   
   For production:
   ```bash
   npm start
   ```

6. **Verify the API is running**
   
   Open `http://localhost:3000` in your browser or API client. You should see:
   ```json
   {
     "success": true,
     "data": null,
     "message": "Capstone Backend API is running!"
   }
   ```

## API Documentation

All responses follow this structure:
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string (optional)
}
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f123...",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f123...",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### GET /api/auth/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f123...",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "User profile retrieved successfully"
}
```

### Location Endpoints

All location endpoints require authentication (Bearer token).

#### POST /api/locations
Save a new location entry.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "metadata": {
    "accuracy": 5,
    "address": "New York, NY"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "location": {
      "id": "64f456...",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-01-01T12:00:00.000Z",
      "metadata": {
        "accuracy": 5,
        "address": "New York, NY"
      },
      "user": "user@example.com",
      "createdAt": "2024-01-01T12:05:00.000Z"
    }
  },
  "message": "Location saved successfully"
}
```

#### GET /api/locations
Retrieve user's location history with pagination.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example:** `GET /api/locations?page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "64f456...",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "timestamp": "2024-01-01T12:00:00.000Z",
        "metadata": {},
        "user": "user@example.com",
        "createdAt": "2024-01-01T12:05:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Locations retrieved successfully"
}
```

#### GET /api/locations/nearby
Find locations within a specified radius.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters (all required):**
- `lat`: Center latitude
- `lng`: Center longitude
- `radius` (optional): Search radius in meters (default: 1000, max: 50000)

**Example:** `GET /api/locations/nearby?lat=40.7128&lng=-74.0060&radius=5000`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": "64f456...",
        "latitude": 40.7589,
        "longitude": -73.9851,
        "timestamp": "2024-01-01T12:00:00.000Z",
        "metadata": {},
        "distance": 4521,
        "user": "user@example.com",
        "createdAt": "2024-01-01T12:05:00.000Z"
      }
    ],
    "query": {
      "center": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "radius": 5000,
      "count": 1
    }
  },
  "message": "Found 1 locations within 5000m radius"
}
```

#### DELETE /api/locations/:id
Delete a specific location entry.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "deletedLocation": {
      "id": "64f456...",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  },
  "message": "Location deleted successfully"
}
```

### Health Check

#### GET /api/health
Check API health status.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "uptime": 3600,
    "memory": {
      "used": "45 MB",
      "total": "128 MB"
    },
    "database": {
      "status": "Connected",
      "name": "capstone-app"
    },
    "environment": "development",
    "version": "1.0.0"
  },
  "message": "Health check successful"
}
```

## Testing with Postman

### 1. Import Environment Variables (Optional)
Create a Postman environment with:
- `baseUrl`: `http://localhost:3000`
- `token`: (will be set after login)

### 2. Test Authentication Flow

1. **Register a new user**
   - POST `{{baseUrl}}/api/auth/register`
   - Body (JSON): `{"email": "test@example.com", "password": "password123"}`

2. **Login**
   - POST `{{baseUrl}}/api/auth/login`
   - Body (JSON): `{"email": "test@example.com", "password": "password123"}`
   - Copy the token from response

3. **Get user profile**
   - GET `{{baseUrl}}/api/auth/me`
   - Headers: `Authorization: Bearer <your-token>`

### 3. Test Location Endpoints

1. **Save a location**
   - POST `{{baseUrl}}/api/locations`
   - Headers: `Authorization: Bearer <your-token>`
   - Body (JSON): `{"latitude": 40.7128, "longitude": -74.0060}`

2. **Get location history**
   - GET `{{baseUrl}}/api/locations`
   - Headers: `Authorization: Bearer <your-token>`

3. **Find nearby locations**
   - GET `{{baseUrl}}/api/locations/nearby?lat=40.7128&lng=-74.0060&radius=1000`
   - Headers: `Authorization: Bearer <your-token>`

4. **Delete a location**
   - DELETE `{{baseUrl}}/api/locations/<location-id>`
   - Headers: `Authorization: Bearer <your-token>`

### 4. Health Check
- GET `{{baseUrl}}/api/health`

## Project Structure

```
capstone-project/
├── models/
│   ├── User.js              # User model with authentication
│   └── Location.js          # Location model with geospatial indexing
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── locations.js         # Location management endpoints
│   └── health.js            # Health check endpoint
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── errorHandler.js      # Global error handling middleware
├── utils/
│   └── validation.js        # Joi validation schemas
├── .env                     # Environment variables
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── server.js               # Main application entry point
└── README.md               # This file
```

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Location Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  latitude: Number (required, -90 to 90),
  longitude: Number (required, -180 to 180),
  timestamp: Date (required),
  metadata: Object (optional),
  location: {  // Auto-generated for geospatial queries
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

The API includes comprehensive error handling for:
- Validation errors (400)
- Authentication errors (401)
- Not found errors (404)
- Server errors (500)
- MongoDB specific errors (duplicate keys, cast errors)

Example error response:
```json
{
  "success": false,
  "data": null,
  "message": "Validation Error",
  "error": "Email is required"
}
```

## Security Features

- Password hashing with bcryptjs (12 salt rounds)
- JWT tokens with 7-day expiration
- Input validation with Joi
- Protected routes with authentication middleware
- User data isolation (users can only access their own data)
- Environment variables for sensitive configuration

## Production Deployment

### Environment Variables for Production
```bash
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/capstone-app
JWT_SECRET=your_super_secure_random_secret_key_at_least_32_characters
NODE_ENV=production
```

### Recommended Production Setup
1. Use a cloud MongoDB service (MongoDB Atlas)
2. Use environment-specific JWT secrets
3. Set up proper logging and monitoring
4. Use HTTPS in production
5. Implement rate limiting if needed
6. Consider using PM2 for process management

## Development Scripts

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon)
npm run dev

# Run in production mode
npm start

# Install nodemon globally for development
npm install -g nodemon
```

## Database Indexes

The application automatically creates the following indexes:
- `User.email` (unique)
- `Location.location` (2dsphere for geospatial queries)
- `Location.userId + timestamp` (compound index for user queries)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

### Overview for Reviewers

This is a capstone project focused on developing a cross-platform mobile application for real-time geospatial tracking and location sharing. The project is in its initial phase, with key objectives being to demonstrate proficiency in full-stack development (React Native, Node.js, PostgreSQL/PostGIS, Supabase) and to deliver a robust, user-centric mapping application. Features will include interactive maps, secure authentication, and modern UI/UX.

---

### Guide for Developers

#### Multi-Branch Workflow

- `main`: Stable, deployable version.
- `frontend`: React Native (Expo) mobile app development.
- `backend`: Node.js/Express API.
- `infra`: Infrastructure scripts, DB migrations, and deployment configs.
- Feature branches: Use `feature/<short-description>`, `bugfix/<short-description>`, or `chore/<task>`, branching from the relevant stack branch.

#### Setup

1. **Clone the repo**
    ```
    git clone https://github.com/yourusername/capstone-project.git
    ```

2. **Switch to the appropriate branch**
    ```
    git checkout frontend    # for mobile app code
    git checkout backend     # for API code
    ```

3. **Install dependencies and run locally** (see per-branch README files for commands)

#### Contribution Guidelines

- Open issues for bugs or proposed features.
- Use pull requests for all merges into `main`, with peer code review.

#### License

MIT License.

---

*For questions or collaboration, please open an issue or PR.*
