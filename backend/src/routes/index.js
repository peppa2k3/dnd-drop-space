const express = require('express');
const { authenticate } = require('../middlewares/auth.middleware');

const authRoutes = require('./auth.routes');
const folderRoutes = require('./folder.routes');
const tagRoutes = require('./tag.routes');
const itemRoutes = require('./item.routes');
const dashboardRoutes = require('./dashboard.routes');
const searchRoutes = require('./search.routes');
const trashRoutes = require('./trash.routes');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { minioClient } = require('../config/minio');
    const env = require('../config/env');
    if (mongoose.connection.readyState !== 1) throw new Error('Database unavailable');
    const [, bucketExists] = await Promise.all([
      mongoose.connection.db.admin().ping(),
      minioClient.bucketExists(env.minio.bucket),
    ]);
    if (!bucketExists) throw new Error('Bucket unavailable');
    return res.json({ success: true, message: 'API is healthy' });
  } catch {
    return res.status(503).json({ success: false, message: 'Storage unavailable' });
  }
});

// Auth routes handle their own mix of public (register/login/refresh) and
// protected (me) endpoints internally.
router.use('/auth', authRoutes);

// Everything below always requires a valid access token - this is the
// single choke point that guarantees every user only ever sees their own
// data (every controller then further scopes queries by req.userId).
router.use('/folders', authenticate, folderRoutes);
router.use('/tags', authenticate, tagRoutes);
router.use('/items', authenticate, itemRoutes);
router.use('/dashboard', authenticate, dashboardRoutes);
router.use('/search', authenticate, searchRoutes);
router.use('/trash', authenticate, trashRoutes);

module.exports = router;
