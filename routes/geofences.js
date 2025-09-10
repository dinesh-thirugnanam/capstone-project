const express = require('express');
const Geofence = require('../models/Geofence');
const auth = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const geofenceSchema = Joi.object({
  name: Joi.string().required().trim().max(100),
  description: Joi.string().optional().trim().max(500),
  centerLatitude: Joi.number().min(-90).max(90).required(),
  centerLongitude: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(1).max(5000).required(),
  isActive: Joi.boolean().optional(),
  officeInfo: Joi.object({
    address: Joi.string().optional().trim(),
    workingHours: Joi.object({
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    workingDays: Joi.array().items(
      Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    ).optional()
  }).optional()
});

// POST /api/geofences - Create a new geofence (Admin only for now)
router.post('/', auth, async (req, res) => {
  try {
    // For now, allow both admin and employee to create geofences for testing
    // In production, you might want: if (req.user.role !== 'admin') return res.status(403)...

    const { error, value } = geofenceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation Error',
        error: error.details[0].message
      });
    }

    const geofence = new Geofence({
      ...value,
      createdBy: req.user._id
    });

    await geofence.save();
    await geofence.populate('createdBy', 'email profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      data: {
        geofence: {
          id: geofence._id,
          name: geofence.name,
          description: geofence.description,
          centerLatitude: geofence.centerLatitude,
          centerLongitude: geofence.centerLongitude,
          radius: geofence.radius,
          isActive: geofence.isActive,
          officeInfo: geofence.officeInfo,
          createdBy: geofence.createdBy,
          createdAt: geofence.createdAt
        }
      },
      message: 'Geofence created successfully'
    });
  } catch (error) {
    console.error('Create geofence error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error creating geofence',
      error: error.message
    });
  }
});

// GET /api/geofences - Get all active geofences
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const geofences = await Geofence
      .find({ isActive: true })
      .populate('createdBy', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Geofence.countDocuments({ isActive: true });
    const totalPages = Math.ceil(total / limit);

    const formattedGeofences = geofences.map(geofence => ({
      id: geofence._id,
      name: geofence.name,
      description: geofence.description,
      centerLatitude: geofence.centerLatitude,
      centerLongitude: geofence.centerLongitude,
      radius: geofence.radius,
      isActive: geofence.isActive,
      officeInfo: geofence.officeInfo,
      createdBy: geofence.createdBy,
      createdAt: geofence.createdAt
    }));

    res.json({
      success: true,
      data: {
        geofences: formattedGeofences,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
      message: 'Geofences retrieved successfully'
    });
  } catch (error) {
    console.error('Get geofences error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error retrieving geofences',
      error: error.message
    });
  }
});

// GET /api/geofences/:id - Get specific geofence
router.get('/:id', auth, async (req, res) => {
  try {
    const geofence = await Geofence
      .findById(req.params.id)
      .populate('createdBy', 'email profile.firstName profile.lastName');

    if (!geofence) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Geofence not found'
      });
    }

    res.json({
      success: true,
      data: {
        geofence: {
          id: geofence._id,
          name: geofence.name,
          description: geofence.description,
          centerLatitude: geofence.centerLatitude,
          centerLongitude: geofence.centerLongitude,
          radius: geofence.radius,
          isActive: geofence.isActive,
          officeInfo: geofence.officeInfo,
          createdBy: geofence.createdBy,
          createdAt: geofence.createdAt
        }
      },
      message: 'Geofence retrieved successfully'
    });
  } catch (error) {
    console.error('Get geofence error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error retrieving geofence',
      error: error.message
    });
  }
});

// PUT /api/geofences/:id - Update geofence
router.put('/:id', auth, async (req, res) => {
  try {
    const { error, value } = geofenceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation Error',
        error: error.details[0].message
      });
    }

    const geofence = await Geofence.findById(req.params.id);
    if (!geofence) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Geofence not found'
      });
    }

    // For now, allow anyone to update. In production, check if user is admin or creator
    // if (req.user.role !== 'admin' && geofence.createdBy.toString() !== req.user._id.toString())

    Object.assign(geofence, value);
    await geofence.save();
    await geofence.populate('createdBy', 'email profile.firstName profile.lastName');

    res.json({
      success: true,
      data: {
        geofence: {
          id: geofence._id,
          name: geofence.name,
          description: geofence.description,
          centerLatitude: geofence.centerLatitude,
          centerLongitude: geofence.centerLongitude,
          radius: geofence.radius,
          isActive: geofence.isActive,
          officeInfo: geofence.officeInfo,
          createdBy: geofence.createdBy,
          updatedAt: geofence.updatedAt
        }
      },
      message: 'Geofence updated successfully'
    });
  } catch (error) {
    console.error('Update geofence error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error updating geofence',
      error: error.message
    });
  }
});

// DELETE /api/geofences/:id - Delete geofence (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const geofence = await Geofence.findById(req.params.id);
    if (!geofence) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Geofence not found'
      });
    }

    // Soft delete by setting isActive to false
    geofence.isActive = false;
    await geofence.save();

    res.json({
      success: true,
      data: {
        deletedGeofence: {
          id: geofence._id,
          name: geofence.name
        }
      },
      message: 'Geofence deleted successfully'
    });
  } catch (error) {
    console.error('Delete geofence error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error deleting geofence',
      error: error.message
    });
  }
});

module.exports = router;
