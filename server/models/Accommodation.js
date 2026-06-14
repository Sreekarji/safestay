const mongoose = require('mongoose');

const AccommodationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amenities: [{
    type: String
  }],
  totalRooms: {
    type: Number,
    required: true
  },
  occupiedRooms: {
    type: Number,
    default: 0
  },
  pricePerMonth: {
    type: Number,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  riskScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  trustScoreLabel: {
    type: String,
    enum: ['Safe', 'Caution', 'Unsafe'],
    default: 'Safe'
  },
  trustScoreColor: {
    type: String,
    enum: ['green', 'yellow', 'red'],
    default: 'green'
  },
  totalReports: {
    type: Number,
    default: 0
  },
  lastScoreUpdate: {
    type: Date,
    default: Date.now
  }
});

AccommodationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Accommodation', AccommodationSchema);
