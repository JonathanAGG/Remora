var express = require('express');
var router = express.Router();

const zeusController = require("../controllers/zeus");
const socketMd = require("../middlewares/sockets");

/* GET */
router.get('/points', zeusController.getPoints);
router.get('/lines', zeusController.getLines);
router.get('/points/:initDate&:endDate', zeusController.getFilter);

/* POST */
router.post('/points',  socketMd.formatPoint, 
                        socketMd.redirectPoint,
                        socketMd.checkGeofence, 
                        zeusController.insertPoint);

module.exports = router;