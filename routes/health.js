const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/health
router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    
    // Get basic system info
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'Unknown'
      },
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };

    res.json({
      success: true,
      data: healthData,
      message: 'Health check successful'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;
