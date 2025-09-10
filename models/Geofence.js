const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Geofence name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  centerLatitude: {
    type: Number,
    required: [true, 'Center latitude is required'],
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  centerLongitude: {
    type: Number,
    required: [true, 'Center longitude is required'],
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  },
  radius: {
    type: Number,
    required: [true, 'Radius is required'],
    min: [1, 'Radius must be at least 1 meter'],
    max: [5000, 'Radius cannot exceed 5000 meters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  // Office/workplace details
  officeInfo: {
    address: String,
    workingHours: {
      start: String, // e.g., "09:00"
      end: String,   // e.g., "17:00"
    },
    workingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  }
}, {
  timestamps: true
});

// Create geospatial index for nearby queries
geofenceSchema.index({ 
  location: '2dsphere' 
});

// Virtual field for GeoJSON format
geofenceSchema.virtual('location').get(function() {
  return {
    type: 'Point',
    coordinates: [this.centerLongitude, this.centerLatitude]
  };
});

// Add location field for geospatial queries
geofenceSchema.pre('save', function(next) {
  this.location = {
    type: 'Point',
    coordinates: [this.centerLongitude, this.centerLatitude]
  };
  next();
});

module.exports = mongoose.model('Geofence', geofenceSchema);
