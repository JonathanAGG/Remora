'use strict'

const io = require('socket.io')(3001);
const turf = require('turf');
const GeoJSON = require('geojson');

const geofencesController = require("../controllers/geofences");
const quadtree = require("../middlewares/demo")

io.on('connection', function (socket) {
  console.log('connection');
  socket.emit('news', { hello: 'world' });
});


//Middleware para darle formato a los datos que vienen del hardware
exports.formatPoint = (req, res, next) => {

  var point = req.body;

  //Fecha actual del servidor
  point['dateServer'] = new Date().addHours(-6);

  //Dar formato a la fecha de remora
  var fecha = "" + point.fecha;
  var dateRemora = new Date(fecha.slice(0, 4), parseInt(fecha.slice(4, 6)) - 1, fecha.slice(6, 8), fecha.slice(8, 10), fecha.slice(10, 12)).addHours(-6);
  point["dateRemora"] = dateRemora;

  //Dar formato al geoJson
  point['geo'] = {
    type: "Point",
    "coordinates": [point.lon, point.lat]
  };

  delete point['fecha'];
  delete point['lat'];
  delete point['lon'];

  next();
}

//Middleware para redirigir el punto 
exports.redirectPoint = (req, res, next) => {

  var point = req.body;
  point['deltaTime'] = 0;
  point['deltaDistance'] = 0;
  var gjNewPoint = GeoJSON.parse(point, { GeoJSON: 'geo' });
  io.emit('newPoint', gjNewPoint);
  next();
}

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
  quadtree.quadtree(geofence).then(function(squaresCollection){

    geofencesController.insertSquares(squaresCollection,id).then(response => {

      io.emit('newSquares', squaresCollection);
    })
    
  })
  next();

  //next();
}