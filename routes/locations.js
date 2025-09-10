const express = require('express');
const Location = require('../models/Location');
const auth = require('../middleware/auth');
const { locationSchema, nearbyLocationSchema } = require('../utils/validation');

const router = express.Router();

// POST /api/locations
router.post('/', auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = locationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation Error',
        error: error.details[0].message
      });
    }

    const { latitude, longitude, timestamp, metadata } = value;

    // Create location
    const location = new Location({
      userId: req.user._id,
      latitude,
      longitude,
      timestamp: timestamp || new Date(),
      metadata: metadata || {}
    });

    await location.save();
    await location.populate('userId', 'email');

    res.status(201).json({
      success: true,
      data: {
        location: {
          id: location._id,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
          metadata: location.metadata,
          user: location.userId.email,
          createdAt: location.createdAt
        }
      },
      message: 'Location saved successfully'
    });
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error saving location',
      error: error.message
    });
  }
});

// GET /api/locations
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get user's locations with pagination
    const locations = await Location
      .find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email');

    const total = await Location.countDocuments({ userId: req.user._id });
    const totalPages = Math.ceil(total / limit);

    const formattedLocations = locations.map(location => ({
      id: location._id,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp,
      metadata: location.metadata,
      user: location.userId.email,
      createdAt: location.createdAt
    }));

    res.json({
      success: true,
      data: {
        locations: formattedLocations,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
      message: 'Locations retrieved successfully'
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error retrieving locations',
      error: error.message
    });
  }
});

// GET /api/locations/nearby
router.get('/nearby', auth, async (req, res) => {
  try {
    // Validate query parameters
    const queryData = {
      latitude: parseFloat(req.query.lat),
      longitude: parseFloat(req.query.lng),
      radius: req.query.radius ? parseFloat(req.query.radius) : 1000
    };

    const { error, value } = nearbyLocationSchema.validate(queryData);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation Error',
        error: error.details[0].message
      });
    }

    const { latitude, longitude, radius } = value;

    // Find locations within radius (using MongoDB's geospatial query)
    const locations = await Location.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          latitude: 1,
          longitude: 1,
          timestamp: 1,
          metadata: 1,
          distance: 1,
          createdAt: 1,
          'user.email': 1
        }
      },
      {
        $sort: { distance: 1 }
      }
    ]);

    const formattedLocations = locations.map(location => ({
      id: location._id,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp,
      metadata: location.metadata,
      distance: Math.round(location.distance), // Distance in meters
      user: location.user.email,
      createdAt: location.createdAt
    }));

    res.json({
      success: true,
      data: {
        locations: formattedLocations,
        query: {
          center: { latitude, longitude },
          radius,
          count: formattedLocations.length
        }
      },
      message: `Found ${formattedLocations.length} locations within ${radius}m radius`
    });
  } catch (error) {
    console.error('Get nearby locations error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error finding nearby locations',
      error: error.message
    });
  }
});

// DELETE /api/locations/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const locationId = req.params.id;

    // Find and delete location (only if it belongs to the authenticated user)
    const location = await Location.findOneAndDelete({
      _id: locationId,
      userId: req.user._id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Location not found',
        error: 'Location not found or you do not have permission to delete it'
      });
    }

    res.json({
      success: true,
      data: {
        deletedLocation: {
          id: location._id,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp
        }
      },
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error deleting location',
      error: error.message
    });
  }
});

module.exports = router;
