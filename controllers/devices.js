'use strict'
var mongo = require('mongodb'); //Biblioteca para comunicarse con la base de datos MongoDB
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

//Retorna todas los dispositivos
exports.getAllDevices = function (req, res) {

    db.collection('Devices').find({ features: { $exists: true } }, { features: 0}).toArray(function (err, doc) {

        if (err) {
            res.status(400).send({ message: err })
        }
        else {
            res.status(200).send(doc)
        }
    });
}

//Retorna los features de un dispositivo
exports.getFeaturesDevice = function (req, res) {

    let deviceId = req.params.deviceId;

    db.collection('Devices').find({ features: { $exists: true }, ID: deviceId }).toArray(function (err, doc) {

        if (err) {
            console.log('err',err)
            res.status(400).send({ message: err })
        }
        else {
            let featureCollection = GeoJSON.parse(doc[0].features, { GeoJSON: 'geo' });
            res.status(200).send(featureCollection)
        }
    });
}

//Retorna la informacion de un dispositivo
exports.getDetailsDevice = function (req, res) {

    let deviceId = req.params.deviceId;

    console.log('deviceId',deviceId)

    db.collection('Devices').find({ ID: deviceId },{features: 0}).toArray(function (err, doc) {

        if (err) {
            console.log('err',err)
            res.status(400).send({ message: err })
        }
        else {
            res.status(200).send(doc)
        }
    });
}

//Actualiza un dispositivo 
exports.editDevice = function (req, res) {

    let detail = req.body,
        id = req.params.deviceId;
    
    delete detail['_id'];

    db.collection('Devices').findAndModify(
        { ID: id },
        [],
        { $set: detail },
        { new: true},
        function (err, doc) {
            if (err) {
                console.log('Err', err)
                res.send(400, err);
            }
            else {
                console.log('saved squares')
                res.send(200, doc);
            }
        });
} 