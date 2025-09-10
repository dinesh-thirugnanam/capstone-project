# 📱 Attendance App - Real-time Geofencing Solution

A professional React Native Expo application with **native geofencing capabilities** for automatic employee attendance tracking. Features real-time location monitoring, admin management tools, and seamless integration with the Node.js backend.

## ✨ Key Features

### � **Authentication System**
- User registration with role selection (Admin/Employee)
- JWT-based secure authentication
- Automatic session restoration
- Role-based access control

### 👨‍💼 **Employee Features**
- **Automatic Attendance Tracking**: Background geofencing with native location services
- **Real-time Dashboard**: Live attendance status and daily summaries
- **Activity History**: Complete log of check-ins and check-outs
- **Smart Notifications**: Instant alerts for attendance events
- **Working Hours Detection**: Identifies events during/after office hours

### 👩‍💻 **Admin Features**
- **Office Management**: Create, edit, and delete office locations
- **Geofence Configuration**: Set custom boundaries and working hours
- **Employee Monitoring**: View all office locations and their status
- **Real-time Reports**: Track attendance across multiple locations

### 🛠️ **Technical Features**
- **Native Geofencing**: Uses `react-native-background-geolocation` for production-ready tracking
- **Background Processing**: Continues tracking even when app is closed
- **Offline Sync**: Queues events when offline, syncs when connected
- **Battery Optimized**: Smart location tracking to preserve device battery
- **Push Notifications**: Real-time attendance alerts using Expo Notifications

## 🏗️ Architecture

### **Frontend Stack**
- **React Native** with Expo (Custom Dev Client)
- **React Navigation 6** for seamless navigation
- **React Context** for state management
- **AsyncStorage** for secure local data persistence
- **React Native Paper** for consistent UI components

### **Backend Integration**
- **RESTful API** with full error handling and retry logic
- **JWT Authentication** with automatic token refresh
- **Real-time Event Processing** for attendance tracking
- **Comprehensive Logging** for debugging and monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS Simulator or Android Emulator

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up native modules (required for geofencing)
npx expo prebuild

# 3. Start development server
npx expo start
```

### **Important**: For full geofencing functionality, you need a **Custom Development Client**:

```bash
# Build custom dev client (one-time setup)
eas build --profile development --platform ios     # or android
# Install the built app on your device

# Then start with dev client
npx expo start --dev-client
```

> **Note**: Background geofencing requires native modules and won't work in Expo Go.

## 🚀 **Ready for Production**

This attendance app is **fully functional** and ready for business deployment. It features:

✅ **Real native geofencing** with background tracking  
✅ **Professional UI/UX** suitable for corporate environments  
✅ **Comprehensive admin tools** for office management  
✅ **Reliable backend integration** with full API coverage  
✅ **Production-grade architecture** with proper error handling  
✅ **Battery-optimized tracking** for all-day monitoring  

**Perfect for businesses requiring automatic, accurate attendance tracking!**
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
