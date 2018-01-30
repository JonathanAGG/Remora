'use strict'
var mongo = require('mongodb'); //Biblioteca para comunicarse con la base de datos MongoDB
var GeoJSON = require('geojson'); //Modulo para parsear de un json a un geoJson
var turf = require('@turf/turf'); //Modulo para medir distancias a partir de coordenadas

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


/**
@AUTHOR:    JONATHAN GRANADOS GUERRERO 
            JGRANADOS0794@GMAIL.COM
**/


exports.quadtree = function (geofence) {

    return new Promise((resolve, reject) => {

        /*  var geofence = {
             "type": "Feature",
             "properties": {},
             "geometry": feature
         }; */

        var matrizBinary = [] //Almacena banderas para indicar cuales cuadros estan contenidos en la geofence
        var matrizFeature = []; //Almacena los cuadros ordenados en formato de matris 

        createGrid(geofence, .5, { units: 'miles' }) //Genera un GRID de cuadros sobre la geofence
            .then((segmentGrid) =>

                createMatriz(geofence, segmentGrid, matrizBinary, matrizFeature)//Devuelve la matriz de binarios y la de caracteristicas para manipularlas luego
            )
            .then((arrMatriz) => {

                matrizBinary = arrMatriz[0] //Almacena banderas para indicar cuales cuadros estan contenidos en la geofence
                matrizFeature = arrMatriz[1]; //Almacena los cuadros ordenados en formato de matris 
                return validateSquare(matrizBinary, matrizFeature, []) //Devuelve los cuadros encontrados en formato (x,y) de la matriz binaria
            })
            .then((arrCoorSegment) =>

                findFeature(arrCoorSegment, matrizFeature) //Toma las coordenadas (x,y) de la matriz binaria y devulve las caracteristicas en formato geojson
            )
            .then((arrSquare) => {
                let featureCollection = turf.featureCollection(arrSquare);
                resolve(featureCollection)
            }
            )
            .catch(() =>

                reject('Error Quadtree')
            );
    })
}

//Divide la geofence en una cuadricula para despues manipularla como una matriz
function createGrid(geofence, cellSide, options) {

    return new Promise(function (resolve, reject) {

        try {
            var bbox = turf.bbox(geofence);
            var grid = turf.squareGrid(bbox, cellSide, options);

            resolve(grid)

        } catch (err) {
            reject(err)
        }
    });
}

//Genera las matrices de binarios de geofences para manipularlas en el algoritmo 
function createMatriz(geofence, segmentGrid, matrizBinary, matrizFeature) {

    var arrIndex = []; //Almacena el indice de cada fila de la matris
    var segmentIsContent = false; //Indica si el segmento esta adentro de la geofence 
    var bolNewRow = true; //Indica que se debe crear una nueva fila en la matriz de cuadros

    segmentGrid.features.forEach(function (segment) {

        //Valida si el segmento esta dentro de la geofence
        segmentIsContent = isContent(geofence, segment)

        //Captura la primera iteracion para inicializar el primer indice de fila e incluir el primer segmento
        if (arrIndex.length < 1) {
            addNewRow(arrIndex, matrizFeature, matrizBinary, segment, segmentIsContent)
        }
        else {

            //Recorre el arr de indices para verificar si el segmento pertenece a una fila existente
            for (var i = 0; i < arrIndex.length; i++) {

                //Agrega el segmento si este pertenece a una fila existente 
                if (arrIndex[i] == segment.geometry.coordinates[0][1][1]) {

                    matrizFeature[i].push(segment)
                    matrizBinary[i].push(segmentIsContent ? 1 : 0)
                    bolNewRow = false;
                }
            }
            //Se ejecuta cuando el segmento no pertenece a ninguna fila existente hasta el momento 
            //Crea el indice de la nueva fila e incluye el segmento 
            if (bolNewRow) {

                addNewRow(arrIndex, matrizFeature, matrizBinary, segment, segmentIsContent)
                bolNewRow = true
            }
        }
    });

    return [matrizBinary, matrizFeature]
}

//Retorna TRUE si el segmento forma parte del geofence 
function isContent(geofence, segment) {

    return (isInside(geofence, segment) || isCross(geofence, segment)) ? true : false;
}

//Retorna TRUE si el segmento esta completamente contenido en el poligono
function isInside(geofence, segment) {

    return turf.booleanContains(geofence, segment);
}

//Retorna TRUE si el segmento interseca el poligono
function isCross(geofence, segment) {

    var lineSquare = turf.polygonToLine(segment);
    return turf.booleanCrosses(geofence, lineSquare);
}

//Genera una nueva fila en las matrices 
function addNewRow(arrIndex, matrizFeature, matrizBinary, segment, segmentIsContent) {

    //Crea el nuevo indice de fila
    arrIndex.push(segment.geometry.coordinates[0][1][1])

    // Crea la nueva fila e ingresa el segmento
    var row = [segment]
    matrizFeature.push(row)

    //Llena la matris de binarios 
    var rowBinary = (segmentIsContent) ? [1] : [0];
    matrizBinary.push(rowBinary)
}

function validateSquare(matrizBinary, matrizFeature, arrSquare) {

    var arrTempSquare = [] //almacene el cuadro mas grande encontrado hasta el momento

    //Recorre las filas
    for (let x = 0; x < matrizBinary.length; x++) {
        //Recorre las columnas
        for (let y = 0; y < matrizBinary[0].length; y++) {

            //Buscar el cuadro mas grande posible 
            var arrCheckedSquare = checkSides(x, y, matrizBinary, matrizFeature)

            //Verifica si el nuevo cuadro es mas grande que el anterior 
            if (arrCheckedSquare.length > arrTempSquare.length) {

                arrTempSquare = arrCheckedSquare;
            }
        }
    }

    updateBinary(arrTempSquare, matrizBinary) //Coloca todos los espacios del cuadro en 0 en la matriz binaria

    //Insertar el cuadro en el arr de features definitivos
    arrSquare.push(arrTempSquare);

    if (arrTempSquare.length >= 1)
        return validateSquare(matrizBinary, matrizFeature, arrSquare)
    else
        return arrSquare;
}

//Al encontrar el cuadro se debe de poner esos espacios en 0
function updateBinary(arrCoorSquare, matrizBinary) {

    arrCoorSquare.forEach(function (coor) {
        matrizBinary[coor[0]][coor[1]] = 0;
    })
}

//Busca el cuadro mas grande posible contenido dentro de la geofence 
function checkSides(initX, initY, matrizBinary, matrizFeature) {

    var arrTempSides = [] //Almacena temporalmente los laterales que se estan validando
    var arrTempSquare = []; //Almacena temporalmente los segmentos del cuadro que se estan validando 

    //Aumente el tamanno del cuadro
    for (let i = 0; i < matrizBinary[0].length; i++) {

        //Recorre los cuadros laterales para verificar si estan dentro de la geofence 
        for (let j = 0; j < i; j++) {

            //Valida el primer segmento del cuadro (botton left segment)
            if (i == 1) {

                if (matrizBinary[i + initX - 1][i + initY - 1] == 1) {

                    arrTempSides.push([i + initX - 1, i + initY - 1])
                }
                else {
                    return arrTempSquare;
                }
            }


            //Valida el segmeto diagonal del cuadro que se esta validando actualmente (top right segment)
            if (j == (i - 1)) {

                if (
                    i + initX - 1 < matrizBinary.length - 1 &&          /*valida que el segmento no este fuera de la matris*/
                    matrizBinary[i + initX][i + initY] == 1)    /*valida que el segmento este contenido en la geofence*/
                    arrTempSides.push([i + initX, i + initY])
                else {

                    //Codicion para incluir los segmentos individuales (El cuadro minimo)
                    /* if(arrTempSides.length == 1 && !isCross(geofence, matrizFeature[i + initX - 1][i + initY - 1] ))
                     arrTempSquare = (arrTempSquare.length == 0) ? arrTempSides : arrTempSquare.concat(arrTempSides)   */

                    return arrTempSquare;
                }
            }

            //Valida los laterales 
            if (
                i + initX == matrizBinary.length || /*valida que el segmento no este fuera de la matris*/
                matrizBinary[j + initX][i + initY] == 0 || matrizBinary[j + initX][i + initY] == undefined ||
                matrizBinary[i + initX][j + initY] == 0 || matrizBinary[i + initX][j + initY] == undefined) {

                return arrTempSquare;
            }

            //Agrega los laterales si estan dentro de la geofence 
            arrTempSides.push(
                [j + initX, i + initY],
                [i + initX, j + initY]
            )
        }

        // console.log(arrTempSides.length)
        //Se agrega al cuadro al aumentar un estrato y cumplirse la condicion de que todos los segmentos esten contenidos en la geofence
        arrTempSquare = (arrTempSquare.length == 0) ? arrTempSides : arrTempSquare.concat(arrTempSides)
        arrTempSides = [] //Limpiar el arr de laterales para iniciar con el siguiente estrato
    }
    return arrTempSquare;
}

function findFeature(arrCoorSquare, matrizFeature) {

    var arrSquare = [];
    var arrSegments = [];
    var bool = true

    arrCoorSquare.forEach(function (sq) {

        sq.forEach(function (coor) {
            arrSegments.push(matrizFeature[coor[0]][coor[1]])
        })

        var square = mergeSegments(arrSegments)

        arrSquare.push(square);
        arrSegments = [];

    });

    return arrSquare;
}

function mergeSegments(arrSegments) {

    var segments = turf.featureCollection(arrSegments);
    var bbox = turf.bbox(segments);
    var square = turf.bboxPolygon(bbox);

    return square
}