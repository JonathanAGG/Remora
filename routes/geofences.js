var express = require('express');
var router = express.Router();


const geofencesController = require("../controllers/geofences");
const geofencesMiddleware = require("../middlewares/geofences");

/* GET */
router.get('/', geofencesController.getPolygons);
router.get('/simplifys', geofencesController.getSimplifys);
router.get('/squares', geofencesController.getSquares);
router.get('/details', geofencesController.getDetails);

/* POST */
router.post('/', geofencesController.insertPolygons);

/* PUT */
router.put('/:id/simplifys', geofencesMiddleware.createSquares ,geofencesController.insertSimplifys ); //Insert simplify
//router.put('/:id/squares', geofencesController.insertSquares ); //Insert squares 

/* DELETE */
router.delete('/:id', geofencesMiddleware.deleteGeofence, geofencesController.deletePolygons);

module.exports = router;
