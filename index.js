require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

const connectToMongoDB = require('./connect');
const urlRoutes = require('./routes/url');
const URL = require('./models/url');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/url', urlRoutes);

app.get('/:shortId', async (req, res) => {
  try {
    const shortId = req.params.shortId;

    const entry = await URL.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: {
            timestamp: Date.now(),
          },
        },
      }
    );

    if (!entry) {
      return res.status(404).send('Short URL not found');
    }

    res.redirect(entry.redirectUrl);
  } catch (error) {
    console.error('Error resolving short URL:', error);
    res.status(500).send('Something went wrong');
  }
});

const port = process.env.PORT || 8001;

connectToMongoDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB, server not started:', error);
    process.exit(1);
  });
