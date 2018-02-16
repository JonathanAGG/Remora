'use strict'

const io = require('../socket');
const GeoJSON = require('geojson');
const turf = require('turf');

const geofencesController = require("../controllers/geofences");
const infractionsController = require("../controllers/infractions");
const notificationModule = require("../modules/notificationModule")

//Middleware para validar si el punto se encuantra dentro de un geofence 
exports.validateInfraction = (req, res, next) => {

  var point = req.body;

  //Verificacion si el punto se encuentra dentro de una geofence
  geofencesController.checkGeofence(point['geo'])
    .then(function (alert) {

      processInfraction(point, alert);

      if (alert.length > 0) {

        req.body['infraction'] = { geofenceName: alert[0].description };
        //console.log('point', point)

        let gjPoint = GeoJSON.parse(point, { GeoJSON: 'geo' });
        let gjPolygon = GeoJSON.parse(alert[0], { GeoJSON: 'geo' });

        let response = {
          geofence: gjPolygon,
          point: gjPoint
        }

        //Real time notification
        io.emit('alert', response);

        /*  //Send mail notification 
         notificationModule.sendEmail(
           ['jgranados0794@gmail.com'],
           'Geofence Alert ' + new Date(),
           'La embarcación: ' + response.point.properties.ID + ' ha ingresado a la geofence: ' + response.geofence.properties.description
         );
 
         //Send sms notification
         notificationModule.sendSms(
           ['+50684711356','+50683459091'],
           'Remora',
           'La embarcacion: ' + response.point.properties.ID + ' ha ingresado a la geofence: ' + response.geofence.properties.description + '. ' + new Date().toDateString()
         ) */
        //processInfraction(response);
      }

      insertPrefix(point);
      next();
    }, function (err) {
      console.log(err);
      next();
    });

}
//Inserta los puntos prefijo
var insertPrefix = (point) => {
  infractionsController.insertPrefix(point);
}

//Administra el control de la ruta de infraccion
var processInfraction = (point, alert) => {

  infractionsController.getInfractionStatus(point).then((tempDoc) => {

    //Si hay una infraccion [inicia o concatena la ruta de infraccion]
    if (alert.length > 0) {

      //Si ya se encuentra en una ruta de infraccion [concat]
      if (tempDoc.temp.isInInfractionRoute) {
        infractionsController.pushInInfractionRoute(point)
      }
      //Si se va a iniciar una ruta de infraccion [init]
      else {
        infractionsController.initInfractionRoute(point, alert[0], tempDoc.temp)
      }

    }
    //Si NO hay una infraccion [De darse el caso concluye la ruta de infraccion]
    else {

      //Si el punto anterior se encuentra en ruta de infraccion [concluir]
      if (tempDoc.temp.isInInfractionRoute) {
        let metrics = getInfractionMetrics(tempDoc.temp);
        infractionsController.endInfractionRoute(point, tempDoc.temp, metrics)
      }

    }
  },
    (err) => {
      console.log(err);
    });
}

//Retorna el tiempo y la distancia de la infraccion 
var getInfractionMetrics = (temp) => {

  let previousPoint,
    distance = 0,
    time = 0;
  temp.infractionRoute.forEach((point, index) => {

    if (index == 0) previousPoint = point

    //Tiempo trancurrido entre punto y punto
    let dateInit = new Date(previousPoint.dateRemora).getTime();
    let dateEnd = new Date(point.dateRemora).getTime();
    let diffMin = (dateEnd - dateInit) / (1000 * 60);
    time += diffMin;

    //Distancia entre punto y punto 
    let from = turf.point(previousPoint.geo.coordinates);
    let to = turf.point(point.geo.coordinates);
    distance += turf.distance(from, to);

    previousPoint = point
  });

  return { time, distance }
}