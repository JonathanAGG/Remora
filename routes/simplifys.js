var express = require('express');
var router = express.Router();

const simplifyController = require("../controllers/simplifys");

/* GET */
router.get('/', simplifyController.getSimplifys);

/* PUT */
router.put('/:id', simplifyController.insertSimplify );

module.exports = router;
