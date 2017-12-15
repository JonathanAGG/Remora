var express = require('express');
var router = express.Router();

const geofencesController = require("../controllers/geofences");
const socketMiddleware = require("../middlewares/sockets");

/* GET */
router.get('/', geofencesController.getPolygons);
router.get('/simplifys', geofencesController.getSimplifys);
router.get('/squares', geofencesController.getSquares);

/* POST */
router.post('/', geofencesController.insertPolygons);

/* PUT */
router.put('/:id/simplifys', geofencesController.insertSimplifys ); //Insert simplify
//router.put('/:id/squares', geofencesController.insertSquares ); //Insert squares 

/* DELETE */
router.delete('/:id', socketMiddleware.deleteGeofence, geofencesController.deletePolygons);

module.exports = router;
