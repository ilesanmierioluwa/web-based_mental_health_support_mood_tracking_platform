const ResourceItem = require('../models/ResourceItem');
const recommendationService = require('../services/recommendationService');

const CATEGORIES = [
  'anxiety',
  'low_mood',
  'stress',
  'sleep',
  'grounding',
  'crisis_support',
];

// @route  GET /api/resources  (public)
const listResources = async (req, res) => {
  try {
    const filter = { is_active: true };
    if (req.query.category) filter.category = req.query.category;
    const items = await ResourceItem.find(filter).sort({ created_at: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/resources/recommendations  (protected, user-scoped)
const getRecommendations = async (req, res) => {
  try {
    const items = await recommendationService.recommendForUser(req.user._id, 3);
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---- Admin CRUD -----------------------------------------------------------

// @route  GET /api/resources/admin
const adminList = async (req, res) => {
  try {
    const items = await ResourceItem.find().sort({ created_at: -1 }).lean();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/resources/admin
const adminCreate = async (req, res) => {
  try {
    const { title, category, body, external_link, tags_for_matching, is_active } = req.body;
    if (!title || !category || !body) {
      return res.status(400).json({ success: false, error: 'title, category and body are required' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }
    const item = await ResourceItem.create({
      title,
      category,
      body,
      external_link: external_link || '',
      tags_for_matching: tags_for_matching || [],
      is_active: is_active === undefined ? true : is_active,
    });
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  PUT /api/resources/admin/:id
const adminUpdate = async (req, res) => {
  try {
    const item = await ResourceItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Resource not found' });
    const fields = ['title', 'category', 'body', 'external_link', 'tags_for_matching', 'is_active'];
    for (const f of fields) {
      if (req.body[f] !== undefined) item[f] = req.body[f];
    }
    await item.save();
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  DELETE /api/resources/admin/:id
const adminDelete = async (req, res) => {
  try {
    const item = await ResourceItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Resource not found' });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { listResources, getRecommendations, adminList, adminCreate, adminUpdate, adminDelete };
