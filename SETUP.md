# Capstone Backend API - Quick Setup Guide

## Prerequisites Check

Before running the application, make sure you have:

### 1. Node.js (v16+)
```bash
node --version
# Should show v16.x.x or higher
```

### 2. MongoDB
You have two options:

#### Option A: Local MongoDB Installation
- Download and install MongoDB Community Server from https://www.mongodb.com/try/download/community
- Start MongoDB service:
  - **Windows**: MongoDB should start automatically, or run `mongod` in command prompt
  - **macOS**: `brew services start mongodb/brew/mongodb-community`
  - **Linux**: `sudo systemctl start mongod`

#### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a free account and cluster
3. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/database`)
4. Update your `.env` file with this connection string

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (edit .env file)
# Update MONGODB_URI if using MongoDB Atlas

# 3. Start the server
npm start

# For development with auto-restart:
npm run dev
```

## Testing the API

### 1. Quick Health Check
Open your browser and go to: http://localhost:3000
You should see: `{"success":true,"data":null,"message":"Capstone Backend API is running!"}`

### 2. Test with curl (if available)
```bash
# Health check
curl http://localhost:3000/api/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Use Postman Collection
Import the `postman-collection.json` file into Postman for comprehensive testing.

## Common Issues and Solutions

### Issue: "MongoNetworkError: connect ECONNREFUSED"
**Solution**: MongoDB is not running
- **Local MongoDB**: Start the MongoDB service
- **MongoDB Atlas**: Check your connection string and network access

### Issue: "JWT_SECRET is not defined"
**Solution**: Make sure your `.env` file exists and contains all required variables

### Issue: "Port 3000 is already in use"
**Solution**: Either:
- Kill the process using port 3000
- Change the PORT in your `.env` file

### Issue: Database connection timeout
**Solution**: 
- If using MongoDB Atlas, make sure to whitelist your IP address
- Check your internet connection
- Verify the connection string format

## Environment Variables

Make sure your `.env` file contains:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/capstone-app
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/capstone-app

# Security
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_in_production
```

## What's Next?

Once your server is running successfully:

1. **Test Authentication**: Use Postman to register and login
2. **Test Location APIs**: Save some locations and try the nearby search
3. **Review the Code**: Check out the well-structured codebase
4. **Customize**: Add your own features and modifications

## Project Structure Overview

```
├── server.js           # Main entry point
├── models/            # Data models (User, Location)
├── routes/            # API endpoints
├── middleware/        # Authentication & error handling
├── utils/             # Validation schemas
├── .env              # Environment variables
└── package.json      # Dependencies
```

## API Endpoints Summary

- **POST** `/api/auth/register` - Register user
- **POST** `/api/auth/login` - Login user  
- **GET** `/api/auth/me` - Get user profile
- **POST** `/api/locations` - Save location
- **GET** `/api/locations` - Get location history
- **GET** `/api/locations/nearby` - Find nearby locations
- **DELETE** `/api/locations/:id` - Delete location
- **GET** `/api/health` - Health check

Happy coding! 🚀
