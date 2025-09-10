const express = require('express');
const Attendance = require('../models/Attendance');
const Geofence = require('../models/Geofence');
const auth = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schema for attendance events
const attendanceEventSchema = Joi.object({
  geofenceId: Joi.string().required(),
  eventType: Joi.string().valid('ENTER', 'EXIT').required(),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).required(),
  timestamp: Joi.date().optional(),
  metadata: Joi.object({
    deviceInfo: Joi.string().optional(),
    accuracy: Joi.number().optional(),
    source: Joi.string().optional()
  }).optional()
});

// Helper function to check if time is within working hours
const isWithinWorkingHours = (timestamp, workingHours) => {
  if (!workingHours || !workingHours.start || !workingHours.end) return false;
  
  const time = new Date(timestamp);
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes since midnight
  
  const [startHour, startMin] = workingHours.start.split(':').map(Number);
  const [endHour, endMin] = workingHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Helper function to check if day is working day
const isWorkingDay = (timestamp, workingDays) => {
  if (!workingDays || workingDays.length === 0) return false;
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[new Date(timestamp).getDay()];
  
  return workingDays.includes(dayName);
};

// POST /api/attendance/event - Record attendance event (ENTER/EXIT geofence)
router.post('/event', auth, async (req, res) => {
  try {
    const { error, value } = attendanceEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation Error',
        error: error.details[0].message
      });
    }

    const { geofenceId, eventType, location, timestamp, metadata } = value;

    // Verify geofence exists and is active
    const geofence = await Geofence.findOne({ 
      _id: geofenceId, 
      isActive: true 
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Geofence not found or inactive'
      });
    }

    const eventTimestamp = timestamp ? new Date(timestamp) : new Date();

    // Calculate work session info
    const workSession = {
      isWorkingHours: isWithinWorkingHours(eventTimestamp, geofence.officeInfo?.workingHours),
      isWorkingDay: isWorkingDay(eventTimestamp, geofence.officeInfo?.workingDays)
    };

    // Create attendance record
    const attendance = new Attendance({
      userId: req.user._id,
      geofenceId,
      eventType,
      timestamp: eventTimestamp,
      location,
      workSession,
      metadata: metadata || {}
    });

    await attendance.save();
    await attendance.populate([
      { path: 'userId', select: 'email profile' },
      { path: 'geofenceId', select: 'name description officeInfo' }
    ]);

    // Log the event for monitoring
    console.log(`📍 Attendance Event: ${req.user.email} ${eventType.toLowerCase()}ed ${geofence.name} at ${eventTimestamp.toISOString()}`);

    res.status(201).json({
      success: true,
      data: {
        attendance: {
          id: attendance._id,
          user: attendance.userId,
          geofence: attendance.geofenceId,
          eventType: attendance.eventType,
          timestamp: attendance.timestamp,
          location: attendance.location,
          workSession: attendance.workSession,
          createdAt: attendance.createdAt
        }
      },
      message: `Attendance ${eventType.toLowerCase()} event recorded successfully`
    });
  } catch (error) {
    console.error('Record attendance event error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error recording attendance event',
      error: error.message
    });
  }
});

// GET /api/attendance/history - Get attendance history for current user
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const geofenceId = req.query.geofenceId;

    // Build query
    const query = { userId: req.user._id };
    
    if (startDate && endDate) {
      query.timestamp = { $gte: startDate, $lte: endDate };
    }
    
    if (geofenceId) {
      query.geofenceId = geofenceId;
    }

    const attendanceRecords = await Attendance
      .find(query)
      .populate('geofenceId', 'name description officeInfo')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const formattedRecords = attendanceRecords.map(record => ({
      id: record._id,
      eventType: record.eventType,
      timestamp: record.timestamp,
      location: record.location,
      workSession: record.workSession,
      geofence: {
        id: record.geofenceId._id,
        name: record.geofenceId.name,
        description: record.geofenceId.description
      },
      createdAt: record.createdAt
    }));

    res.json({
      success: true,
      data: {
        attendanceHistory: formattedRecords,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
      message: 'Attendance history retrieved successfully'
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error retrieving attendance history',
      error: error.message
    });
  }
});

// GET /api/attendance/summary/:date - Get daily attendance summary
router.get('/summary/:date', auth, async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance
      .find({
        userId: req.user._id,
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
      .populate('geofenceId', 'name description officeInfo')
      .sort({ timestamp: 1 });

    // Group by geofence and calculate work duration
    const summaryByGeofence = {};
    
    for (const record of attendanceRecords) {
      const geofenceId = record.geofenceId._id.toString();
      
      if (!summaryByGeofence[geofenceId]) {
        summaryByGeofence[geofenceId] = {
          geofence: {
            id: record.geofenceId._id,
            name: record.geofenceId.name,
            description: record.geofenceId.description
          },
          events: [],
          totalWorkMinutes: 0,
          firstEntry: null,
          lastExit: null
        };
      }
      
      summaryByGeofence[geofenceId].events.push({
        eventType: record.eventType,
        timestamp: record.timestamp,
        workSession: record.workSession
      });
      
      if (record.eventType === 'ENTER') {
        if (!summaryByGeofence[geofenceId].firstEntry) {
          summaryByGeofence[geofenceId].firstEntry = record.timestamp;
        }
      } else if (record.eventType === 'EXIT') {
        summaryByGeofence[geofenceId].lastExit = record.timestamp;
      }
    }

    // Calculate work duration for each geofence
    for (const geofenceId of Object.keys(summaryByGeofence)) {
      const duration = await Attendance.getWorkSessionDuration(
        req.user._id,
        geofenceId,
        targetDate
      );
      summaryByGeofence[geofenceId].totalWorkMinutes = duration;
    }

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        summaryByGeofence: Object.values(summaryByGeofence),
        totalLocations: Object.keys(summaryByGeofence).length,
        totalEvents: attendanceRecords.length
      },
      message: 'Daily attendance summary retrieved successfully'
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error retrieving attendance summary',
      error: error.message
    });
  }
});

// GET /api/attendance/status - Get current attendance status (are they inside any geofence?)
router.get('/status', auth, async (req, res) => {
  try {
    // Get the most recent attendance event for each active geofence
    const recentEvents = await Attendance.aggregate([
      {
        $match: { userId: req.user._id }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$geofenceId',
          latestEvent: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'geofences',
          localField: '_id',
          foreignField: '_id',
          as: 'geofence'
        }
      },
      {
        $unwind: '$geofence'
      },
      {
        $match: {
          'geofence.isActive': true
        }
      }
    ]);

    const currentStatus = recentEvents
      .filter(item => item.latestEvent.eventType === 'ENTER')
      .map(item => ({
        geofence: {
          id: item.geofence._id,
          name: item.geofence.name,
          description: item.geofence.description
        },
        enteredAt: item.latestEvent.timestamp,
        location: item.latestEvent.location
      }));

    res.json({
      success: true,
      data: {
        isCurrentlyInside: currentStatus.length > 0,
        currentLocations: currentStatus,
        timestamp: new Date()
      },
      message: 'Current attendance status retrieved successfully'
    });
  } catch (error) {
    console.error('Get attendance status error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error retrieving attendance status',
      error: error.message
    });
  }
});

module.exports = router;
