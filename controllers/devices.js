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

//Retorna todos los dispositivos
exports.getAllDevices = function (req, res) {

    db.collection('Devices').find().toArray(function (err, doc) {

        if (err) {
            res.status(400).send({ message: err })
        }
        else {

            doc.forEach(device => {

                if (device.features) {
                    delete device['features']
                    device['isOperating'] = true
                } else {
                    device['isOperating'] = false
                }
            });
            res.status(200).send(doc)
        }
    });
}

//Retorna los dispositivos que estan en funcionamiento
exports.getOperatingDevices = function (req, res) {

    db.collection('Devices').find({ features: { $exists: true } }, { features: 0 }).toArray(function (err, doc) {

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
            console.log('err', err)
            res.status(400).send({ message: err })
        }
        else {
            let features = doc[0] ? doc[0].features : [];
            let featureCollection = GeoJSON.parse(features, { GeoJSON: 'geo' });
            res.status(200).send(featureCollection)
        }
    });
}

//Retorna la informacion de un dispositivo
exports.getDetailsDevice = function (req, res) {

    let deviceId = req.params.deviceId;

    console.log('deviceId', deviceId)

    db.collection('Devices').find({ ID: deviceId }, { features: 0 }).toArray(function (err, doc) {

        if (err) {
            console.log('err', err)
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
        { new: true },
        function (err, doc) {
            if (err) {
                console.log('Err', err)
                res.send(400, err);
            }
            else {
                res.send(200, doc);
            }
        });
}

//Actualiza un dispositivo 
exports.insertDevice = function (req, res) {

    let detail = req.body;

    if (detail.ID == '') {
        res.send(422, "Id is Required");
    }
    else {

        db.collection('Devices').findAndModify(
            { ID: detail.ID },
            [],
            { $set: detail },
            { new: true, upsert: true },
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
}

//Elimina un dispositivo
exports.deleteDevice = function (req, res) {

    let id = req.params.id;

    db.collection('Devices').findAndRemove({ ID: id }, function (err, doc) {

        err ? res.status(400).send(err) : res.status(202).send(doc);
    });
}