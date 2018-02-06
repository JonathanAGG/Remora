'use strict'

const io = require('../socket');
const GeoJSON = require('geojson');

const geofencesController = require("../controllers/geofences");
const squaresGenerator = require("../libraries/squaresGenerator")

io.on('connection', function (socket) {
  console.log('connection');
});

//Middleware para validar si el punto se encuantra dentro de un geofence 
exports.checkGeofence = (req, res, next) => {

  var point = req.body;

  //Verificacion si el punto se encuentra dentro de una geofence
  geofencesController.checkGeofence(point['geo'])
    .then(function (alert) {

      if (alert.length > 0) {
        let gjPoint = GeoJSON.parse(point, { GeoJSON: 'geo' });
        let gjPolygon = GeoJSON.parse(alert[0], { GeoJSON: 'geo' });

        let response = {
          geofence: gjPolygon,
          point: gjPoint
        }

        io.emit('alert', response);
      }
    }, function (err) {
      console.log(err);
    });
  next();
}

exports.deleteGeofence = (req, res, next) => {

  io.emit('news', { message: 'deleted' });
  console.log('delete');
  next();
}

exports.createSquares = (req, res, next) => {
  let geofence = req.body
  let id = req.params.id
  squaresGenerator.generator(geofence).then(function(squaresCollection){

    geofencesController.insertSquares(squaresCollection,id).then(response => {

      io.emit('newSquares', squaresCollection);
    })
    
  })
  next();
}