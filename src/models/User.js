const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  username: {
    type: String,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows multiple null values
  },
  profileImage: {
    type: String,
    default: null
  },
  nonce: {
    type: String,
    required: true
  },
  languages: [{
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['beginner', 'intermediate', advanced', 'native'],
      required: true
    },
    isNative: {
      type: Boolean,
      default: false
    }
  }],
  stats: {
    totalSubmissions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    reputation: { type: Number, default: 100 },
    totalRewards: { type: Number, default: 0 }
  },
  validatorStatus: {
    isValidator: { type: Boolean, default: false },
    approvedLanguages: [String],
    validationAccuracy: { type: Number, default: 0 },
    totalValidations: { type: Number, default: 0 }
  },
  preferences: {
    defaultSourceLanguage: { type: String, default: 'en' },
    defaultTargetLanguage: { type: String, default: 'es' },
    difficulty: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
      default: 'mixed' 
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ walletAddress: 1 });
userSchema.index({ 'stats.reputation': -1 });
userSchema.index({ 'validatorStatus.isValidator': 1 });

// Generate random nonce for signature verification
userSchema.methods.generateNonce = function() {
  this.nonce = Math.floor(Math.random() * 1000000).toString();
  return this.nonce;
};

// Update user stats
userSchema.methods.updateStats = function(isCorrect, rewardAmount = 0) {
  this.stats.totalSubmissions += 1;
  
  if (isCorrect) {
    this.stats.correctAnswers += 1;
    this.stats.currentStreak += 1;
    this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.currentStreak);
  } else {
    this.stats.currentStreak = 0;
  }
  
  this.stats.accuracy = (this.stats.correctAnswers / this.stats.totalSubmissions) * 100;
  this.stats.totalRewards += rewardAmount;
  
  return this.save();
};

module.exports = mongoose.model('User', userSchema);