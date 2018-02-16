var express = require('express');
var router = express.Router();


const infractionsController = require("../controllers/infractions");

/* GET */
router.get('/:deviceId', infractionsController.getInfractionsDevice);


module.exports = router;