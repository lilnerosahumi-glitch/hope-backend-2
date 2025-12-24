const mongoose = require('mongoose');

const LetterSchema = new mongoose.Schema({
  recipient: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['encouragement', 'friendship', 'hope', 'self-care', 'school', ''],
    default: ''
  },
  color: {
    type: String,
    default: '#CBB0FF'
  },
  message: {
    type: String,
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for formatted date (year only)
LetterSchema.virtual('year').get(function() {
  return this.createdAt.getFullYear();
});

module.exports = mongoose.model('Letter', LetterSchema);