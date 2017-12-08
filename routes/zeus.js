var express = require('express');
var router = express.Router();

const zeusController = require("../controllers/zeus");

/* GET */
router.get('/points', zeusController.getPoints);
router.get('/lines', zeusController.getLines);

/* POST */
router.post('/points', zeusController.insertPoint); //EndPoint for Hardware //Falta realTime y checkGeofence

module.exports = router;
