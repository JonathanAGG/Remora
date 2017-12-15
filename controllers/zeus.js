'use strict'
var mongo = require('mongodb'); //Biblioteca para comunicarse con la base de datos MongoDB
//var GeoJSON = require('geojson'); //Modulo para parsear de un json a un geoJson
//var turf = require('turf'); //Modulo para medir distancias a partir de coordenadas
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



//Retorna todos los puntos
exports.getPoints = (req, res) => {

    //Indexes geospatial
    //db.collection('Zeus').createIndex({ geo: "2dsphere" })
    //   db.collection('geofence').createIndex({ geo: "2dsphere" })

    db.collection('Zeus').find({ geo: { $exists: true } }).sort({ dateRemora: 1 }).toArray(function (err, doc) {

        if (err) res.send(404,{err})
        
        else {

            console.log('ak7')

            var previousPoint, distance;
            doc.forEach(function (element, index) {



                if (index == 0) previousPoint = element

                //Tiempo trancurrido entre punto y punto
                let dateInit = new Date(previousPoint.dateRemora).getTime();
                let dateEnd = new Date(element.dateRemora).getTime();
                let diffMin = (dateEnd - dateInit) / (1000 * 60);

                //Distancia entre punto y punto 
                let from = turf.point(previousPoint.geo.coordinates);
                let to = turf.point(element.geo.coordinates);
                distance = turf.distance(from, to);

                element['deltaDistance'] = distance;
                element['deltaTime'] = diffMin;
                element['Head'] = parseInt(element['Head']) + 180
                previousPoint = element

            })

            res.send(200,doc)
        }
    });
}
 
//Retorna todas las lineas
exports.getLines = (req,res) => {

        db.collection('Zeus').aggregate([{
            $group: {
                _id: "$ID", 
                line: {
                    $push: "$geo.coordinates"
                }
            }
        }], function (err, doc) {

            if (err) { throw err; res.send(400, err); }
            else {
                res.send(200,doc)
            }
        });
}

//Retorna los datos filtrados por fechas
exports.getFilter = function (req, res) {
    
        var initDate = new Date(req.params.initDate),
            endDate = req.params.endDate ? new Date(req.params.endDate) : new Date();

            console.log('demo',initDate)
    
        Promise.all([filterPoints(initDate, endDate), filterLines(initDate, endDate)]).then(function (data) {
    
           
            /* let gjPoints = GeoJSON.parse(data[0], { GeoJSON: 'geo' });
            var gjLines = GeoJSON.parse(data[1], { 'LineString': 'line' }); */
    
            res.send(200, { d: data});
        });
    
    
    }
    
    //Filtracion de los puntos
    var filterPoints = (initDate, endDate) => {
    
        return new Promise(function (resolve, reject) {
    
            db.collection('Zeus').find({
                "$and": [
                    { "dateRemora": { "$gte":initDate } },
                    { "dateRemora": { "$lte":endDate } }]
            }).sort({ dateRemora: 1 }).toArray(function (err, doc) {
    
                if (err) { throw err; res.send(400, err); }
                else {
    
                    var previousPoint, distance;
                    doc.forEach(function (element, index) {
    
                        if (index == 0) previousPoint = element
    
                        //Tiempo trancurrido entre punto y punto
                        let dateInit = new Date(previousPoint.dateRemora).getTime();
                        let dateEnd = new Date(element.dateRemora).getTime();
                        let diffMin = (dateEnd - dateInit) / (1000 * 60);
    
                        //Distancia entre punto y punto 
                        let from = turf.point(previousPoint.geo.coordinates);
                        let to = turf.point(element.geo.coordinates);
                        distance = turf.distance(from, to);
    
                        element['deltaDistance'] = distance;
                        element['deltaTime'] = diffMin;
                        element['Head'] = parseInt(element['Head']) + 180
                        previousPoint = element
    
                    })
                    resolve(doc)
                }
            });
    
    
        });
    }
    
    //Filtracion de las lineas
    var filterLines = (initDate, endDate) => {
    
        return new Promise(function (resolve, reject) {
    
            db.collection('Zeus').aggregate([
                {
                    $match: {
                        "$and": [
                            { "dateRemora": { "$gte": initDate } },
                            { "dateRemora": { "$lte": endDate } }]
                    }
                },
                {
                    $group: {
                        _id: "$ID",
                        line: {
                            $push: "$geo.coordinates"
                        }
                    }
                }
            ],
                function (err, doc) {
    
                    if (err) { throw err; res.send(400, err); }
                    else {
                        resolve(doc)
                    }
                });
        });
    }
    
//Inserta un nuevo punto 
exports.insertPoint = function (req, res) {

    var pos = req.body;
    db.collection('Zeus').insert(pos, function (err, doc) {
        if (err) { throw err; res.send(400, {message: err}); }
        else {
            res.send(200, doc);
        }
    });
} 