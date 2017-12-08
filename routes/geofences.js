var express = require('express');
var router = express.Router();

const geofencesController = require("../controllers/geofences");

/* GET */
router.get('/polygons', geofencesController.getPolygons);

/* POST */
router.post('/polygons', geofencesController.insertPolygons);

/* DELETE */
router.delete('/polygons/:id', geofencesController.deletePolygons);

module.exports = router;
