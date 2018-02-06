'use strict'
var mongo = require('mongodb'); //Biblioteca para comunicarse con la base de datos MongoDB
//var GeoJSON = require('geojson'); //Modulo para parsear de un json a un geoJson
//var turf = require('turf'); //Modulo para medir distancias a partir de coordenadas
var turf = require('turf'); //Modulo para medir distancias a partir de coordenadas
const GeoJSON = require('geojson');

//Puerto de conexión con la base de datos (no es el mismo de escucha del servidor)
var uristring =
    process.env.MONGOLAB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost/Remora',
    //'mongodb://heroku_v37rd9bf:lsd8ccnsrsn5skoiv1rpncad77@ds011890.mlab.com:11890/heroku_v37rd9bf',
    db;


//Conexión con la base de datos
mongo.MongoClient.connect(uristring, function (err, database) {
    if (!err) {
        db = database; //Instancia de la base de datos
        console.log('Connected to the "Zeus" database');
    }
    else {
        console.log(404, 'Error Connecting to the "Zeus" database');
    }
});

//Función para el manejo de la zona horaria
Date.prototype.addHours = function (h) {
    this.setHours(this.getHours() + h);
    return this;
}


//Retorna todos los puntos
exports.getAllPoints = (req, res) => {

    //Indexes geospatial (Habilitar solo la primera vez)
    //db.collection('Zeus').createIndex({ geo: "2dsphere" })
    //db.collection('geofence').createIndex({ geo: "2dsphere" })

    db.collection('Devices').aggregate([
        {
            $match: {}
        },
        {
            $group: {
                _id: "$ID",
                points: {
                    $push: "$features"
                }
            }
        }
    ],
        function (err, doc) {

            if (err) {
                console.log('ddErr', err);
                res.status(400).send(err);
            }
            else {
                let arrFeatures = [];
                doc.forEach(device => {

                    if (device.points.length > 0) {

                        var previousPoint, distance;
                        device.points[0].forEach((point, index) => {

                            if (index == 0) previousPoint = point

                            //Tiempo trancurrido entre punto y punto
                            let dateInit = new Date(previousPoint.dateRemora).getTime();
                            let dateEnd = new Date(point.dateRemora).getTime();
                            let diffMin = (dateEnd - dateInit) / (1000 * 60);

                            //Distancia entre punto y punto 
                            let from = turf.point(previousPoint.geo.coordinates);
                            let to = turf.point(point.geo.coordinates);
                            distance = turf.distance(from, to);

                            point['deltaDistance'] = distance;
                            point['deltaTime'] = diffMin;
                            point['Head'] = parseInt(point['Head']) + 180
                            previousPoint = point

                            arrFeatures.push(point)
                        });

                    }
                });
                let featureCollection = GeoJSON.parse(arrFeatures, { GeoJSON: 'geo' });
                res.status(200).send(featureCollection)
            }
        });
}

//Retorna todas las lineas
exports.getAllLines = (req, res) => {

    db.collection('Devices').aggregate([
        {
            $match: {}
        },
        {
            $group: {
                _id: "$ID",
                points: {
                    $push: "$features"
                }
            }
        }
    ],
        (err, doc) => {

            if (err) {
                console.log('ddErr', err);
                res.status(400).send(err);
            }
            else {

                let arrFeatures = [], i = 0;
                doc.forEach((device, index) => {

                    if (device.points.length > 0) {

                        arrFeatures.push({ ID: device._id, line: [] })
                        device.points[0].forEach(point => {
                            arrFeatures[i].line.push(point.geo.coordinates);
                        });
                        i++;
                    }
                });
                let featureCollection = GeoJSON.parse(arrFeatures, { 'LineString': 'line' });
                res.status(200).send(featureCollection)
            }
        });
}

//Retorna los datos filtrados por fechas
exports.getFilter = function (req, res) {

    var initDate = new Date(req.body.initDate),
        endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(),
        arrDevices = req.body.devices

    db.collection('Devices').aggregate([
        {
            $match: { ID: { $in: arrDevices } }
        },
        {
            $project: {
                features: {
                    $filter: {
                        input: "$features",
                        as: "feature",
                        cond: {
                            "$and": [
                                { $gte: ["$$feature.dateRemora", initDate] },
                                { $lte: ["$$feature.dateRemora", endDate] }

                            ]
                        }
                    }
                }
            }
        }
    ],
        function (err, doc) {

            if (err) {
                console.log('errr', err)
                reject(err);
            }
            else {
                let arrFeaturesPoints = [],
                    arrFeaturesLines = [];
                doc.forEach((device, indexDevice) => {

                    if (device.features.length != 0) arrFeaturesLines.push({ ID: '', line: [] })
                    var previousPoint, distance;

                    device.features.forEach((feature, indexFeature) => {

                        /* Point */
                        if (indexFeature == 0) previousPoint = feature

                        //Tiempo trancurrido entre punto y punto
                        let dateInit = new Date(previousPoint.dateRemora).getTime();
                        let dateEnd = new Date(feature.dateRemora).getTime();
                        let diffMin = (dateEnd - dateInit) / (1000 * 60);

                        //Distancia entre punto y punto 
                        let from = turf.point(previousPoint.geo.coordinates);
                        let to = turf.point(feature.geo.coordinates);
                        distance = turf.distance(from, to);

                        feature['deltaDistance'] = distance;
                        feature['deltaTime'] = diffMin;
                        feature['Head'] = parseInt(feature['Head']) + 180
                        previousPoint = feature

                        arrFeaturesPoints.push(feature);

                        /* Lines */
                        arrFeaturesLines[indexDevice].ID = feature.ID;
                        arrFeaturesLines[indexDevice].line.push(feature.geo.coordinates)

                    });
                });
                let gjPoints = GeoJSON.parse(arrFeaturesPoints, { GeoJSON: 'geo' });
                let gjLines = GeoJSON.parse(arrFeaturesLines, { 'LineString': 'line' });
                res.status(200).send({ gjPoints, gjLines })
            }
        });
}

//Inserta un nuevo punto 
exports.insertPoint = function (req, res) {

    var point = req.body;
    db.collection('Devices').findAndModify(
        { ID: point.ID },
        [],
        { $addToSet: { features: point } },
        { new: true, upsert: true },
        function (err, doc) {
            if (err) {
                console.log('SQ err')
                res.send(400, err);
            }
            else {
                console.log('saved squares')
                res.send(200, doc);
            }
        });
} 