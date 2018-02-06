var express = require('express');
var router = express.Router();

const zeusController = require("../controllers/zeus");
const zeusMiddleware = require("../middlewares/zeus");
const geofencesMiddleware = require("../middlewares/geofences");

/* GET */
router.get('/points', zeusController.getAllPoints);
router.get('/lines', zeusController.getAllLines);

/* POST */
router.post('/filter', zeusController.getFilter);

router.post('/points',  zeusMiddleware.formatPoint, 
                        zeusMiddleware.redirectPoint,
                        geofencesMiddleware.checkGeofence,
                        zeusController.insertPoint);

module.exports = router;