'use strict'

const io = require('../socket');
const GeoJSON = require('geojson');

const geofencesController = require("../controllers/geofences");
const squaresGenerator = require("../modules/squaresGenerator")
const notificationModule = require("../modules/notificationModule")

io.on('connection', function (socket) {
  console.log('connection');
});

exports.createSquares = (req, res, next) => {
  let geofence = req.body
  let id = req.params.id
  squaresGenerator.generator(geofence).then(function (squaresCollection) {

    geofencesController.insertSquares(squaresCollection, id).then(response => {

      io.emit('newSquares', squaresCollection);
    })

  })
  next();
}