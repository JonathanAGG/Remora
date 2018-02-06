var express = require('express');
var router = express.Router();

const devicesController = require("../controllers/devices");

/* GET */
router.get('/', devicesController.getAllDevices);
router.get('/operating', devicesController.getOperatingDevices);
router.get('/:deviceId/features', devicesController.getFeaturesDevice);
router.get('/:deviceId/details', devicesController.getDetailsDevice);

/* POST */
router.post('/', devicesController.insertDevice)

/* PUD */
router.put('/:deviceId', devicesController.editDevice)

/* DELETE */
router.delete('/:id', devicesController.deleteDevice);


module.exports = router;