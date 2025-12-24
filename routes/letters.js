const express = require('express');
const router = express.Router();
const Letter = require('../models/Letter');

// Get all letters
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { recipient: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== '') {
      query.category = category;
    }
    
    const letters = await Letter.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');
    
    // Transform to include only year
    const lettersWithYear = letters.map(letter => ({
      ...letter.toObject(),
      createdAt: letter.year
    }));
    
    res.json(lettersWithYear);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new letter
router.post('/', async (req, res) => {
  try {
    const { recipient, category, color, message } = req.body;
    
    const letter = new Letter({
      recipient: recipient || '',
      category: category || '',
      color: color || '#CBB0FF',
      message
    });
    
    await letter.save();
    
    // Return with year only
    res.status(201).json({
      ...letter.toObject(),
      createdAt: letter.year
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a letter
router.post('/:id/like', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    
    // In a real app, you would track which user liked it
    // For simplicity, we'll just increment a like count
    letter.likes.push(new Date().getTime()); // Using timestamp as placeholder
    await letter.save();
    
    res.json({ likes: letter.likes.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;