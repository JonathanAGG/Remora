var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  //res.json({msj: "ola k ase"})
  console.log('index')
});

module.exports = router;
