'use strict'
var mongo = require('mongodb'); //Biblioteca para comunicarse con la base de datos MongoDB
//var GeoJSON = require('geojson'); //Modulo para parsear de un json a un geoJson
var turf = require('turf'); //Modulo para medir distancias a partir de coordenadas

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



//Retorna todas las geofences
exports.getPolygons = function (req, res) {

    db.collection('geofence').find({ geo: { $exists: true } }, { simplify: 0, squares: 0 }).toArray(function (err, doc) {

        err ? res.send(404, { message: err }) : res.send(200, doc);
    });
}

//Retorna todas las geofences simplificadas
exports.getSimplifys = (req, res) => {

    db.collection('geofence').find({ simplify: { $exists: true } }, { geo: 0, squares: 0 }).toArray(function (err, doc) {

        err ? res.status(404).send({ message: err }) : res.status(200).send(doc)
    });
}

//Retorna todos los cuadros de las geofences
exports.getSquares = function (req, res) {

    //res.status(200).send({ message: 'ak7' })
    db.collection('geofence').find({ squares: { $exists: true } }, { geo: 0, simplify: 0 }).toArray(function (err, doc) {

        err ? res.status(404).send({ message: err }) : res.status(200).send(doc)
    });
}

//Inserta una nueva geofence
exports.insertPolygons = (req, res) => {

    let gjCollection = req.body

    var arrGeofences = [];
    //Recorrer todas las features para almacenar los poligonos uno por uno
    gjCollection.features.forEach(function (feature) {

        arrGeofences.push({
            description: 'zona protegida',
            geo: feature.geometry
        })
    })

    //Guardar las geofences
    db.collection('geofence').insert(arrGeofences, function (err, doc) {
        if (err) {
            throw err;
            res.send(404, { message: err })
        }
        else res.send(201, doc)
    });
}

//Inserta la geofence simplificada (Actualiza la geofence original)
exports.insertSimplifys = (req, res) => {

    let _id = new mongo.ObjectID(req.params.id),
        simplify = req.body.geometry;

    db.collection('geofence').findAndModify(
        { _id: _id },
        [],
        { $set: { simplify } },
        { new: true },
        function (err, doc) {
            if (err) {
                throw err;
                res.status(404).send({ message: err })
            }
            else res.status(201).send(doc)
        });
}

//Inserta la los cuadros de que le pertenecen a una geofence 
exports.insertSquares = (data, id) => {

    let _id = new mongo.ObjectID(id),
        squares = data

    db.collection('geofence').findAndModify(
        { _id: _id },
        [],
        { $set: { squares } },
        { new: true },
        function (err, doc) {
            if (err) {
                console.log('SQ err')
                throw err;
            }
            else {
                resolve(doc)
            }
        });
}

//Elimina una geofence
exports.deletePolygons = function (req, res) {

    let id = req.params.id;

    console.log('id', id)
    db.collection('geofence').findAndRemove({ _id: new mongo.ObjectID(id) }, function (err, doc) {

        err ? res.send(400, { message: err }) : res.send(202, doc);
    });
}

//Comprueba si el nuevo punto a insertar se encuentro dentro de una geofence
exports.checkGeofence = (geo) => {

    return new Promise((resolve, reject) => {

        db.collection('geofence').find({
            geo:
                {
                    $nearSphere:
                        {
                            $geometry: geo,
                            $maxDistance: 0
                        }
                }
        }).toArray(function (err, doc) {

            err ? reject(err) : resolve(doc)
        });

    })
}