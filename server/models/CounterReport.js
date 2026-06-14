const mongoose = require('mongoose');

const CounterReportSchema = new mongoose.Schema({
  originalReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  accommodation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Accommodation',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['false_information', 'outdated_issue', 'mistaken_identity', 'resolved_issue', 'malicious_intent', 'other']
  },
  explanation: {
    type: String,
    required: true
  },
  evidenceUrls: [{
    type: String
  }],
  evidenceDescription: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  }
});

module.exports = mongoose.model('CounterReport', CounterReportSchema);
