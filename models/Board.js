const mongoose = require('mongoose');

const ElementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'image', 'gif', 'sticker', 'music', 'shape'],
    required: true
  },
  content: String,
  x: Number,
  y: Number,
  zIndex: Number,
  width: String,
  height: String,
  fontFamily: String,
  fontSize: Number,
  color: String,
  backgroundColor: String,
  fontWeight: String,
  fontStyle: String,
  textDecoration: String,
  textAlign: String
});

const BoardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  backgroundColor: {
    type: String,
    default: '#f9f9f9'
  },
  elements: [ElementSchema],
  shareToken: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate share token
BoardSchema.pre('save', function(next) {
  if (!this.shareToken) {
    this.shareToken = Math.random().toString(36).substring(2, 15);
  }
  next();
});

module.exports = mongoose.model('Board', BoardSchema);