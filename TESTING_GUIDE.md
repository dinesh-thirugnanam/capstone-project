# 🧪 Testing Guide - Attendance App

## Quick Testing Checklist

### 1. **Start the Backend Server**
```bash
# In the backend directory
cd ../backend/capstone-project
npm install
npm start
# Server should run on http://localhost:3000
```

### 2. **Start the Frontend App**
```bash
# In this directory
npx expo start
```

### 3. **Test Authentication Flow**

**Register Admin Account:**
- Open the app
- Tap "Sign Up"
- Enter email: `admin@test.com`
- Choose role: "Administrator"  
- Enter password: `password123`
- Tap "Create Account"

**Register Employee Account:**
- Logout from admin account
- Tap "Sign Up" 
- Enter email: `employee@test.com`
- Choose role: "Employee"
- Enter password: `password123`
- Tap "Create Account"

### 4. **Test Admin Features**

**Login as Admin:**
- Email: `admin@test.com`
- Password: `password123`

**Create Office Location:**
- Tap "➕ Add Office"
- Office Name: "Test Office"
- Latitude: `40.7128` (New York)
- Longitude: `-74.0060`  
- Radius: `100`
- Address: "123 Test Street"
- Working Hours: `09:00` to `17:00`
- Tap "Save"

### 5. **Test Employee Features**

**Login as Employee:**
- Logout from admin
- Login with `employee@test.com` / `password123`
- Should see employee dashboard
- Location permission prompt will appear - **Grant "Always" access**

**Simulate Geofence Events:**
Since testing real geofencing requires physical movement, you can:

1. **Use Simulator Location:**
   - iOS Simulator: Debug → Location → Custom Location
   - Enter coordinates near your test office
   - Move in/out of geofence radius

2. **Test API Directly:**
   ```bash
   # Test entering office (use Postman or curl)
   POST http://localhost:3000/api/attendance/event
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "geofenceId": "YOUR_OFFICE_ID",
     "eventType": "ENTER",
     "location": { "latitude": 40.7128, "longitude": -74.0060 }
   }
   ```

### 6. **Verify Results**

**Check Dashboard:**
- Employee dashboard should show "In Office" status
- Daily summary should update
- Recent activity should show the event

**Check Backend Logs:**
- Backend console should show attendance event
- Database should have new attendance record

## 🚀 Full Geofencing Test (Physical Device)

For **real geofencing testing**, you need a **Custom Development Client**:

### Step 1: Build Custom Dev Client
```bash
# Initialize EAS (one-time)
eas login
eas build:configure

# Build for your platform
eas build --profile development --platform ios     # or android
```

### Step 2: Install and Test
1. Install the built app on your physical device
2. Start the dev server: `npx expo start --dev-client`
3. Open the app on your device
4. Login as employee and grant location permissions
5. **Physically walk** in and out of your configured geofence area
6. Watch for automatic attendance events

## 🐛 Common Testing Issues

### "Cannot connect to backend"
- ✅ Ensure backend is running on `localhost:3000`
- ✅ Update `src/utils/constants.js` if using different URL
- ✅ Check firewall/network settings

### "Geofencing not triggering"
- ✅ Use physical device with Custom Dev Client
- ✅ Ensure "Always" location permission granted
- ✅ Check background app refresh is enabled
- ✅ Walk at least 50 meters to trigger events

### "Login/Register failing"
- ✅ Check backend console for errors
- ✅ Verify database is connected
- ✅ Check network connectivity
- ✅ Look for validation errors in app

### "Permission prompts not appearing"
- ✅ Reset app permissions in device settings
- ✅ Uninstall/reinstall app
- ✅ Check expo-location plugin configuration

## 📊 Success Criteria

After testing, you should have:

- [x] Admin can create/edit/delete office locations
- [x] Employee sees real-time attendance dashboard  
- [x] Geofence events are automatically detected
- [x] Backend receives and stores attendance data
- [x] Notifications appear for attendance events
- [x] Dashboard shows accurate daily summaries
- [x] Role-based access control works correctly

## 🎯 Production Testing

Before production deployment:

1. **Test on Multiple Devices**
   - iOS and Android
   - Different OS versions
   - Various location accuracy settings

2. **Battery Testing**
   - Monitor battery drain over full day
   - Test in various power modes
   - Verify background processing efficiency

3. **Network Testing**
   - Test offline functionality
   - Verify sync when connection restored
   - Test with poor network conditions

4. **Scale Testing**
   - Multiple employees tracking simultaneously
   - Large geofence radius scenarios
   - High-frequency location updates

---

**The app is ready for business use once all tests pass!** 🚀
