var express = require('express');
var router = express.Router();

const geofencesController = require("../controllers/geofences");

/* GET */
router.get('/', geofencesController.getPolygons);
router.get('/simplifys', geofencesController.getSimplifyPolygons);

/* POST */
router.post('/', geofencesController.insertPolygons);

/* DELETE */
router.delete('/:id', geofencesController.deletePolygons);

/* PUT */
router.put('/:id/simplifys', geofencesController.insertSimplify );

module.exports = router;
