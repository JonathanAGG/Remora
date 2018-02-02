var express = require('express');
var router = express.Router();

const devicesController = require("../controllers/devices");

/* GET */
router.get('/', devicesController.getAllDevices);
router.get('/:deviceId/features', devicesController.getFeaturesDevice);
router.get('/:deviceId/details', devicesController.getDetailsDevice);

/* POST */

/* PUD */
router.put('/:deviceId', devicesController.editDevice)


module.exports = router;