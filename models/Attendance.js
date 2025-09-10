const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  geofenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Geofence',
    required: [true, 'Geofence ID is required']
  },
  eventType: {
    type: String,
    enum: ['ENTER', 'EXIT'],
    required: [true, 'Event type is required']
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required']
    }
  },
  // Calculate work session info
  workSession: {
    isWorkingHours: {
      type: Boolean,
      default: false
    },
    isWorkingDay: {
      type: Boolean,
      default: false
    }
  },
  // Metadata for debugging/tracking
  metadata: {
    deviceInfo: String,
    accuracy: Number,
    source: {
      type: String,
      default: 'mobile_app'
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
attendanceSchema.index({ userId: 1, timestamp: -1 });
attendanceSchema.index({ geofenceId: 1, timestamp: -1 });
attendanceSchema.index({ userId: 1, geofenceId: 1, timestamp: -1 });

// Method to calculate work session duration
attendanceSchema.statics.getWorkSessionDuration = async function(userId, geofenceId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const events = await this.find({
    userId,
    geofenceId,
    timestamp: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort({ timestamp: 1 });
  
  let totalDuration = 0;
  let enterTime = null;
  
  for (const event of events) {
    if (event.eventType === 'ENTER') {
      enterTime = event.timestamp;
    } else if (event.eventType === 'EXIT' && enterTime) {
      totalDuration += (event.timestamp - enterTime);
      enterTime = null;
    }
  }
  
  // If still inside (no exit event), calculate till now
  if (enterTime) {
    totalDuration += (new Date() - enterTime);
  }
  
  return Math.floor(totalDuration / (1000 * 60)); // Return in minutes
};

module.exports = mongoose.model('Attendance', attendanceSchema);
