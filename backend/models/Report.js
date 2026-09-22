const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  keyMetrics: {
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    codingScore: { type: Number, default: 0 },
    behavioralScore: { type: Number, default: 0 }
  },
  detailedSummary: {
    type: String,
    default: ''
  },
  pdfUrl: {
    type: String,
    default: ''
  }
}, { 
  timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } 
});

module.exports = mongoose.model('Report', ReportSchema);
