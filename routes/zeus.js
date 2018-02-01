var express = require('express');
var router = express.Router();

const zeusController = require("../controllers/zeus");
const socketMd = require("../middlewares/sockets");

/* GET */
router.get('/points', zeusController.getAllPoints);
router.get('/lines', zeusController.getAllLines);
router.get('/devices', zeusController.getAllDevices);
router.get('/devices/:deviceId', zeusController.getDevice);

/* POST */
router.post('/filter', zeusController.getFilter);
router.post('/points',  socketMd.formatPoint, 
                        socketMd.redirectPoint,
                        socketMd.checkGeofence, 
                        zeusController.insertPoint);

module.exports = router;