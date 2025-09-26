const express = require('express');
const User = require('../models/User');
const CryptoUtils = require('../utils/crypto');
const schemas = require('../validation/authSchemas');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth/nonce - Get nonce for wallet address
router.get('/nonce', async (req, res) => {
  try {
    const { error } = schemas.getNonce.validate(req.query);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message,
        code: 'VALIDATION_ERROR' 
      });
    }

    const { walletAddress } = req.query;
    const normalizedAddress = walletAddress.toLowerCase();

    // Find or create user
    let user = await User.findOne({ walletAddress: normalizedAddress });
    
    if (!user) {
      user = new User({
        walletAddress: normalizedAddress,
        nonce: Math.floor(Math.random() * 1000000).toString()
      });
    } else {
      user.generateNonce();
    }

    await user.save();

    // Generate message for signing
    const message = CryptoUtils.generateAuthMessage(walletAddress, user.nonce);

    res.json({
      nonce: user.nonce,
      message,
      walletAddress: normalizedAddress
    });

  } catch (error) {
    console.error('Get nonce error:', error);
    res.status(500).json({ 
      error: 'Failed to generate nonce',
      code: 'NONCE_ERROR' 
    });
  }
});

// POST /api/auth/verify - Verify signature and return JWT
router.post('/verify', async (req, res) => {
  try {
    const { error } = schemas.verifySignature.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0].message,
        code: 'VALIDATION_ERROR' 
      });
    }

    const { walletAddress, signature, message } = req.body;
    const normalizedAddress = walletAddress.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress: normalizedAddress });
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found. Please request a new nonce.',
        code: 'USER_NOT_FOUND' 
      });
    }

    // Verify the signature
    const isValidSignature = CryptoUtils.verifySignature(message, signature, walletAddress);
    if (!isValidSignature) {
      return res.status(401).json({ 
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE' 
      });
    }

    // Generate new nonce for future use
    user.generateNonce();
    await user.save();

    // Generate JWT token
    const token = CryptoUtils.generateJWT(user._id, normalizedAddress);

    res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        username: user.username,
        profileImage: user.profileImage,
        languages: user.languages,
        stats: user.stats,
        validatorStatus: user.validatorStatus,
        preferences: user.preferences,
        createdAt: user.createdAt
      },
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      code: 'AUTH_ERROR' 
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        walletAddress: req.user.walletAddress,
        username: req.user.username,
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
    console.error('Get user info error:', error);
    res.status(500).json({ 
      error: 'Failed to get user information',
      code: 'USER_INFO_ERROR' 
    });
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = CryptoUtils.generateJWT(req.user._id, req.user.walletAddress);
    
    res.json({
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh token',
      code: 'REFRESH_ERROR' 
    });
  }
});

module.exports = router;