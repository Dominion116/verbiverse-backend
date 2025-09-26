const express = require('express');
const User = require('../models/User');
const schemas = require('../validation/authSchemas');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        walletAddress: req.user.walletAddress,
        username: req.user.username,
        email: req.user.email,
        profileImage: req.user.profileImage,
        languages: req.user.languages,
        stats: req.user.stats,
        validatorStatus: req.user.validatorStatus,
        preferences: req.user.preferences,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to get profile',
      code: 'PROFILE_ERROR' 
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { error } = schemas.updateProfile.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message,
        code: 'VALIDATION_ERROR' 
      });
    }

    const updateData = req.body;
    
    // Check if username is already taken (if provided)
    if (updateData.username) {
      const existingUser = await User.findOne({ 
        username: updateData.username,
        _id: { $ne: req.user._id }
      });
      
      if (existingUser) {
        return res.status(409).json({ 
          error: 'Username already taken',
          code: 'USERNAME_EXISTS' 
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        walletAddress: updatedUser.walletAddress,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        languages: updatedUser.languages,
        stats: updatedUser.stats,
        validatorStatus: updatedUser.validatorStatus,
        preferences: updatedUser.preferences,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      code: 'UPDATE_ERROR' 
    });
  }
});

// GET /api/users/stats - Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Could add additional computed stats here
    const stats = {
      ...user.stats.toObject(),
      rank: await User.countDocuments({ 
        'stats.reputation': { $gt: user.stats.reputation } 
      }) + 1,
      percentile: 0 // Calculate based on total users if needed
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      code: 'STATS_ERROR' 
    });
  }
});

module.exports = router;