const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');

// Get all resources
router.get('/', async (req, res) => {
  try {
    const { tag } = req.query;
    let query = {};
    
    if (tag && tag !== 'all') {
      query.tags = tag;
    }
    
    const resources = await Resource.find(query).sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new resource
router.post('/', async (req, res) => {
  try {
    const { title, description, content, tags, icon } = req.body;
    
    const resource = new Resource({
      title,
      description,
      content,
      tags,
      icon
    });
    
    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;