const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/stats', dashboardController.stats);

module.exports = router;
