'use strict'
const mongo = require('mongodb');
const turf = require('turf');
const GeoJSON = require('geojson');


const uristring =
    process.env.MONGODB_URI ||
    'mongodb://localhost/Remora';
//'mongodb://heroku_v37rd9bf:lsd8ccnsrsn5skoiv1rpncad77@ds011890.mlab.com:11890/heroku_v37rd9bf';
var db;


//Conexión con la base de datos
mongo.MongoClient.connect(uristring, function (err, database) {
    if (!err) {
        db = database; //Instancia de la base de datos
        console.log('Connected to the "Zeus.Inf" database');
    }
    else {
        console.log(404, 'Error Connecting to the "Zeus" database');
    }
});



//Retorna las infracciones de un dispositivo [DEPRECATED]
exports.getInfractionsDevice = function (req, res) {

    let deviceId = req.params.deviceId;

    db.collection('Devices').find({ ID: deviceId }, { infractions: 1 }).toArray(function (err, doc) {

        if (err) {
            console.log('err', err)
            res.status(400).send({ message: err })
        }
        else {

            let arrResponse = []
            doc[0].infractions.forEach(infraction => {

                //Points
                let arrPoints = [];
                arrPoints.push(infraction.prefix)
                arrPoints = arrPoints.concat(infraction.infractionRoute);
                arrPoints.push(infraction.postfix)
                let gjPoints = GeoJSON.parse(arrPoints, { GeoJSON: 'geo' });

                //Lines
                let arrLines = [];
                arrLines.push(infraction.prefix.geo.coordinates)
                infraction.infractionRoute.forEach(point => {
                    arrLines.push(point.geo.coordinates)
                });
                arrLines.push(infraction.postfix.geo.coordinates)
                let gjLines = GeoJSON.parse({ line: arrLines }, { 'LineString': 'line' });



                //Dates
                let lengthInfraction = infraction.infractionRoute.length;
                let initDate = infraction.infractionRoute[0].dateRemora;
                let endDate = infraction.infractionRoute[lengthInfraction - 1].dateRemora;

                //Response
                let response = {

                    gjPoints,
                    gjLines,
                    initDate,
                    endDate,
                    time: infraction.time,
                    distance: infraction.distance.toFixed(3),
                    geofenceName: infraction.geofenceName
                }

                arrResponse.push(response)
            });
            res.status(200).send(arrResponse)
        }
    });
}

/* ********* Funciones para controlar todo el proceso que sucede durante una ruta de infraccion [temp] ******** */

//Inserta el nuevo punto prefijo
exports.insertPrefix = function (point) {

    db.collection('Devices').findAndModify(
        { ID: point.ID },
        [],
        {
            $push: {
                "temp.prefix": {
                    $each: [point],
                    $slice: -1
                }
            }
        },
        { new: true, upsert: true },
        function (err, doc) {
            if (err) {
                console.log('SQ err')
                //res.send(400, err);
            }
            else {
                //console.log('saved prefix')
                //res.send(200, doc);
            }
        });
}

exports.getInfractionStatus = (point) => {

    return new Promise((resolve, reject) => {

        db.collection('Devices').find({ ID: point.ID }, { temp: 1 }).toArray(function (err, doc) {

            if (err) {
                reject(err)
            }
            else {
                resolve(doc[0])
            }
        });
    });
}

//Inserta el nuevo punto in el arreglo temporal de infracciones [concatena]
exports.pushInInfractionRoute = (point) => {

    console.log('pushh')

    db.collection('Devices').findAndModify(
        { ID: point.ID },
        [],
        {
            $addToSet: {
                "temp.infractionRoute": point
            }
        },
        { new: true, upsert: true },
        function (err, doc) {
            if (err) {
                console.log('SQ err')
                //res.send(400, err);
            }
            else {
                console.log('saved pushInfraction')
                //res.send(200, doc);
            }
        });
}

//Inicia una nueva ruta de infracciones
exports.initInfractionRoute = (point, geofence, temp) => {

    db.collection('Devices').findAndModify(
        { ID: point.ID },
        [],
        {
            $addToSet: {
                "temp.infractionRoute": point
            },
            $set: {
                "temp.isInInfractionRoute": true,
                "temp.prefixInfraction": temp.prefix[0],
                "temp.geofenceName": geofence.description
            }
        },
        { new: true, upsert: true },
        function (err, doc) {
            if (err) {
                console.log('SQ err')
                //res.send(400, err);
            }
            else {
                console.log('saved initInfraction')
                //res.send(200, doc);
            }
        });
}

//Concluye una ruta de infracciones
exports.endInfractionRoute = (point, temp, metrics) => {

    let infractionData = {
        infractionRoute: temp.infractionRoute,
        postfix: point,
        prefix: temp.prefixInfraction,
        time: metrics.time,
        distance: metrics.distance,
        geofenceName: temp.geofenceName
    }

    db.collection('Devices').findAndModify(
        { ID: point.ID },
        [],
        {
            $set: {
                "temp.isInInfractionRoute": false,
                "temp.infractionRoute": [],
                "temp.prefixInfraction": [],
                "temp.geofenceName": ""
            },
            $addToSet: {
                "infractions": infractionData
            }
        },
        { new: true, upsert: true },
        function (err, doc) {
            if (err) {
                console.log('SQ err')
            }
            else {
                console.log('saved endInfraction')
            }
        });
}