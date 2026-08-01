const express = require('express');
const shortid = require('short-id');
const Url = require('../models/url');

const router = express.Router();

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function generateUniqueShortId() {
  // short-id isn't guaranteed unique across restarts, so we retry on collision
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = shortid.generate();
    const exists = await Url.findOne({ shortId: candidate }).lean();
    if (!exists) return candidate;
  }
  throw new Error('Could not generate a unique short ID, please try again');
}

async function handleGenerateNewShortUrl(req, res) {
  try {
    const body = req.body;

    if (!body || !body.url || typeof body.url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidUrl(body.url)) {
      return res.status(400).json({ error: 'Please provide a valid http(s) URL' });
    }

    const shortId = await generateUniqueShortId();

    await Url.create({
      shortId,
      redirectUrl: body.url,
      visitHistory: [],
    });

    return res.json({ shortId });
  } catch (error) {
    console.error('Error creating short URL:', error);
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }
}

async function handleGetAnalytics(req, res) {
  try {
    const shortId = req.params.shortId;
    const result = await Url.findOne({ shortId });

    if (!result) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    return res.json({
      totalClicks: result.visitHistory.length,
      analytics: result.visitHistory,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Something went wrong, please try again' });
  }
}

router.post('/', handleGenerateNewShortUrl);
router.get('/analytics/:shortId', handleGetAnalytics);

module.exports = router;
