'use strict'

const io = require('../socket');
const GeoJSON = require('geojson');

io.on('connection', function (socket) {
  console.log('connection');
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