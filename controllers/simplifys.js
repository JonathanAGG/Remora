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


//Retorna todas las geofences simplificadas
exports.getSimplifys = (req, res) => {

        db.collection('geofence').find({ simplify: { $exists: true } }, { geo: 0, squares: 0 }).toArray(function (err, doc) {

            err ? res.status(404).send({message: err}) : res.status(200).send(doc) 
        });
}

//Retorna todos los cuadros de las geofences
exports.getSquares = function () {
    
        return new Promise((resolve, reject) => {
    
            db.collection('geofence').find({ squares: { $exists: true } }, { geo: 0, simplify:0 }).toArray(function (err, doc) {
    
                err ? reject(err) : resolve(doc)
            });
        });
    }



//Inserta la geofence simplificada (Actualiza la geofence original)
exports.insertSimplify = (req, res) => {

    //res.send(200,{message: req.body.geometry})

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
                    res.status(404).send({message: err})
                }
                else res.status(201).send(doc)
            });
}

//Inserta la los cuadros de que le pertenecen a una geofence 
exports.insertSquare = (data, id) => {


    return new Promise((resolve, reject) => {

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
    });

}